const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

const DATA_DIR = path.resolve(process.env.DATA_DIR || path.resolve(__dirname, "../../data"));
const LOCK_FILE = path.join(DATA_DIR, ".json-storage.lock");
const LOCK_STALE_MS = 30_000;
const LOCK_RETRY_MS = 40;
const LOCK_RETRY_LIMIT = 75;
const WRITE_RETRY_LIMIT = 3;

let writeQueue = Promise.resolve();

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ensureDataDir = async () => {
  await fsp.mkdir(DATA_DIR, { recursive: true });
};

const getFilePath = (fileName) => path.join(DATA_DIR, fileName);

const getBackupFileName = (fileName) => fileName.replace(/\.json$/i, ".backup.json");

const getBackupFilePath = (fileName) => getFilePath(getBackupFileName(fileName));

const logStorage = (message, details = {}) => {
  const parts = Object.entries(details)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${value}`);
  console.info(`[jsonStorage] ${message}${parts.length ? ` ${parts.join(" ")}` : ""}`);
};

const ensureJsonFile = async (fileName) => {
  await ensureDataDir();
  const filePath = getFilePath(fileName);
  try {
    await fsp.access(filePath, fs.constants.F_OK);
  } catch {
    await atomicWriteRaw(filePath, []);
    logStorage("Created missing JSON file", { file: fileName, records: 0 });
  }
};

const parseJsonArray = (raw, fileName) => {
  const parsed = JSON.parse(raw || "[]");
  if (!Array.isArray(parsed)) {
    throw new Error(`${fileName} must contain a JSON array.`);
  }
  return parsed;
};

const atomicWriteRaw = async (targetPath, data) => {
  await ensureDataDir();
  const tmpPath = `${targetPath}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`;
  const json = `${JSON.stringify(data, null, 2)}\n`;
  let handle;

  try {
    handle = await fsp.open(tmpPath, "w");
    await handle.writeFile(json, "utf8");
    await handle.sync();
    await handle.close();
    handle = null;
    await fsp.rename(tmpPath, targetPath);
  } finally {
    if (handle) {
      await handle.close().catch(() => {});
    }
    await fsp.unlink(tmpPath).catch(() => {});
  }
};

const readBackupUnsafe = async (fileName) => {
  const backupPath = getBackupFilePath(fileName);
  const raw = await fsp.readFile(backupPath, "utf8");
  return parseJsonArray(raw, getBackupFileName(fileName));
};

const restoreFromBackupUnsafe = async (fileName) => {
  try {
    const backupData = await readBackupUnsafe(fileName);
    await atomicWriteRaw(getFilePath(fileName), backupData);
    logStorage("Recovered corrupted JSON from backup", {
      file: fileName,
      backup: getBackupFileName(fileName),
      records: backupData.length,
    });
    return backupData;
  } catch (backupError) {
    await atomicWriteRaw(getFilePath(fileName), []);
    logStorage("Reset corrupted JSON because backup was unavailable", {
      file: fileName,
      error: backupError.message,
      records: 0,
    });
    return [];
  }
};

const readJsonUnsafe = async (fileName) => {
  await ensureJsonFile(fileName);
  const filePath = getFilePath(fileName);

  try {
    const raw = await fsp.readFile(filePath, "utf8");
    return parseJsonArray(raw, fileName);
  } catch (error) {
    logStorage("Invalid JSON detected", { file: fileName, error: error.message });
    return restoreFromBackupUnsafe(fileName);
  }
};

const backupJsonUnsafe = async (fileName, currentData) => {
  const data = Array.isArray(currentData) ? currentData : await readJsonUnsafe(fileName);
  await atomicWriteRaw(getBackupFilePath(fileName), data);
  logStorage("Backup written", {
    file: getBackupFileName(fileName),
    source: fileName,
    records: data.length,
  });
};

const acquireLock = async () => {
  await ensureDataDir();

  for (let attempt = 1; attempt <= LOCK_RETRY_LIMIT; attempt += 1) {
    try {
      const handle = await fsp.open(LOCK_FILE, "wx");
      await handle.writeFile(JSON.stringify({
        pid: process.pid,
        createdAt: new Date().toISOString(),
      }));
      await handle.close();
      return;
    } catch (error) {
      if (error.code !== "EEXIST") throw error;

      try {
        const stat = await fsp.stat(LOCK_FILE);
        if (Date.now() - stat.mtimeMs > LOCK_STALE_MS) {
          await fsp.unlink(LOCK_FILE).catch(() => {});
          continue;
        }
      } catch {
        continue;
      }

      await delay(LOCK_RETRY_MS * attempt);
    }
  }

  throw new Error("Timed out waiting for JSON storage lock.");
};

const releaseLock = async () => {
  await fsp.unlink(LOCK_FILE).catch(() => {});
};

const withFileLock = async (operation) => {
  await acquireLock();
  try {
    return await operation();
  } finally {
    await releaseLock();
  }
};

const retryWrite = async (operation, label) => {
  let lastError;

  for (let attempt = 1; attempt <= WRITE_RETRY_LIMIT; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      logStorage("Write attempt failed", { operation: label, attempt, error: error.message });
      await delay(50 * attempt);
    }
  }

  throw lastError;
};

const enqueueWrite = (label, operation) => {
  const queued = writeQueue
    .catch(() => {})
    .then(() => withFileLock(() => retryWrite(operation, label)));

  writeQueue = queued.catch(() => {});
  return queued;
};

const readJson = async (fileName) => {
  await writeQueue.catch(() => {});
  return readJsonUnsafe(fileName);
};

const backupJson = async (fileName) => enqueueWrite(`backup:${fileName}`, async () => {
  const currentData = await readJsonUnsafe(fileName);
  await backupJsonUnsafe(fileName, currentData);
  return currentData;
});

const writeJson = async (fileName, data, options = {}) => enqueueWrite(`write:${fileName}`, async () => {
  if (!Array.isArray(data)) {
    throw new Error(`${fileName} writes must receive a JSON array.`);
  }

  const currentData = await readJsonUnsafe(fileName);
  await backupJsonUnsafe(fileName, currentData);
  await atomicWriteRaw(getFilePath(fileName), data);
  logStorage(options.logMessage || "JSON file written", {
    file: fileName,
    records: data.length,
  });
  return data;
});

const appendJson = async (fileName, itemOrFactory, options = {}) => enqueueWrite(`append:${fileName}`, async () => {
  const currentData = await readJsonUnsafe(fileName);
  const item = typeof itemOrFactory === "function"
    ? await itemOrFactory([...currentData])
    : itemOrFactory;

  const nextData = [...currentData, item];
  await backupJsonUnsafe(fileName, currentData);
  await atomicWriteRaw(getFilePath(fileName), nextData);
  logStorage(options.logMessage || "JSON record appended", {
    file: fileName,
    records: nextData.length,
    id: item?.id || item?.paymentId || item?.bookingId,
  });
  return item;
});

const updateJson = async (fileName, updater, options = {}) => enqueueWrite(`update:${fileName}`, async () => {
  const currentData = await readJsonUnsafe(fileName);
  const result = await updater([...currentData]);
  const nextData = Array.isArray(result) ? result : result.data;

  if (!Array.isArray(nextData)) {
    throw new Error(`${fileName} update must return a JSON array.`);
  }

  await backupJsonUnsafe(fileName, currentData);
  await atomicWriteRaw(getFilePath(fileName), nextData);
  logStorage(options.logMessage || "JSON file updated", {
    file: fileName,
    records: nextData.length,
  });
  return Array.isArray(result) ? nextData : result;
});

const transactionJson = async (fileNames, handler, options = {}) => enqueueWrite(`transaction:${fileNames.join(",")}`, async () => {
  const snapshots = {};
  const workingCopies = {};

  for (const fileName of fileNames) {
    const data = await readJsonUnsafe(fileName);
    snapshots[fileName] = data;
    workingCopies[fileName] = [...data];
  }

  const result = await handler(workingCopies);
  const updates = result?.data || workingCopies;

  for (const fileName of fileNames) {
    if (!Array.isArray(updates[fileName])) {
      throw new Error(`Transaction did not provide an array for ${fileName}.`);
    }
  }

  for (const fileName of fileNames) {
    await backupJsonUnsafe(fileName, snapshots[fileName]);
  }

  for (const fileName of fileNames) {
    await atomicWriteRaw(getFilePath(fileName), updates[fileName]);
    logStorage(options.logMessage || "JSON transaction file written", {
      file: fileName,
      records: updates[fileName].length,
    });
  }

  return result;
});

const initJsonStorage = async () => {
  const files = ["users.json", "registrations.json", "payments.json", "verifications.json", "notifications.json"];
  await ensureDataDir();

  for (const fileName of files) {
    await ensureJsonFile(fileName);
    if (["users.json", "registrations.json", "payments.json", "verifications.json"].includes(fileName)) {
      const data = await readJsonUnsafe(fileName);
      await backupJsonUnsafe(fileName, data);
    }
  }
};

module.exports = {
  DATA_DIR,
  readJson,
  writeJson,
  appendJson,
  backupJson,
  updateJson,
  transactionJson,
  initJsonStorage,
};
