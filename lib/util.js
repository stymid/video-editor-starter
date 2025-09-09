const fs = require("node:fs/promises");

const util = {};

// Delete a file if exists, if not the function will not throw an error
util.file = async (path) => {
  try {
    await fs.unlink(path);
  } catch (e) {
    //do nothing
  }
};

// Delete a folder if exist, if not the function will not throw an error
util.deleteFolder = async (path) => {
  try {
    await fs.rm(path, { recursive: true, force: true });
  } catch (e) {
    // do nothing
  }
};

module.exports = util;
