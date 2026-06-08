const fs = require("fs");
const path = require("path");

const DATA_DIR = path.resolve(process.env.DATA_DIR || path.resolve(__dirname, "../../data"));

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to get file path
const getFilePath = (fileName) => path.join(DATA_DIR, fileName);

// Reusable JSON utility functions
const readJsonFile = (fileName) => {
  const filePath = getFilePath(fileName);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw || "[]");
  } catch (err) {
    console.error(`Error reading ${fileName}:`, err.message);
    return [];
  }
};

const writeJsonFile = (fileName, data) => {
  const filePath = getFilePath(fileName);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error(`Error writing to ${fileName}:`, err.message);
    return false;
  }
};

// Seed initial files if empty
const initDbFiles = () => {
  const files = ["users.json", "registrations.json", "payments.json", "verifications.json", "notifications.json"];
  files.forEach((file) => {
    const filePath = getFilePath(file);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    }
  });
};

initDbFiles();

module.exports = {
  readJsonFile,
  writeJsonFile,
  initDbFiles
};
