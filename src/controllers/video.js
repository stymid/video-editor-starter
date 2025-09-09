const path = require("node:path");
const crypto = require("node:crypto");
const fsp = require("node:fs/promises");
const fs = require("node:fs");
const { pipeline } = require("node:stream/promises");
const util = require("../../lib/util");
const db = require("../DB");

const getVideos = (req, res, handleError) => {
  const name = req.params.get("name");
  if (name) {
    res.json({ message: `Your name is ${name}` });
  } else {
    return handleError({ status: 400, message: "Please spesify a name." });
  }
};

const ALLOWED_EXTS = new Set(["mp4", "mov", "mkv", "webm"]);

const uploadVideo = async (req, res, handleErr) => {
  const specefiedFileName = req.headers["filename"];
  if (!specefiedFileName || typeof specefiedFileName !== "string") {
    return handleErr({
      status: 400,
      message: "filename header is required (X-Filename or filename)",
    });
  }
  const extention = path.extname(specefiedFileName).substring(1).toLowerCase();
  if (!ALLOWED_EXTS.has(extention)) {
    return handleErr({
      status: 415,
      message: `Unsupported extention: .${extention}`,
    });
  }

  const name = path.parse(specefiedFileName).name;
  const videoId = crypto.randomBytes(4).toString("hex");
  const folder = path.join(process.cwd(), "storage", videoId);
  const dest = path.join(folder, `original.${extention}`);

  try {
    await fsp.mkdir(folder, { recursive: true });
    const ws = fs.createWriteStream(dest, { flags: "wx" });

    await pipeline(req, ws);
    // Get the thumbnale
    // Get the dimantion
    db.update();
    db.videos.unshift({
      id: db.videos.length,
      videoId,
      name,
      extention,
      userId: req.userId,
      extractedAudio: false,
      resizes: {},
    });
    db.save();
    return res.status(201).json({
      status: "success",
      message: "The file was updated successfully!",
    });
  } catch (err) {
    util.deleteFolder(folder);
    if (
      !req.aborted ||
      err?.code !== "ECONNRESET" ||
      err?.code !== "ERR_STREAM_PREMATURE_CLOSE" ||
      err?.name !== "AbortError"
    ) {
      return handleErr(err);
    }
  }

  console.warn("upload aborted:", err?.code || err?.message);

  // console.log(specefiedFileName, name, extention);
};

const controller = {
  getVideos,
  uploadVideo,
};

module.exports = controller;
