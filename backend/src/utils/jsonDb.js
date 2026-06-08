const {
  readJson,
  writeJson,
  appendJson,
  backupJson,
  updateJson,
  transactionJson,
  initJsonStorage,
} = require("./jsonStorage");

module.exports = {
  readJsonFile: readJson,
  writeJsonFile: writeJson,
  appendJson,
  backupJson,
  updateJson,
  transactionJson,
  initDbFiles: initJsonStorage,
};
