const path = require("node:path");
const crypto = require("node:crypto");
const fsp = require("node:fs/promises");
const fs = require("node:fs");
const { pipeline } = require("node:stream/promises");
const util = require("../../lib/util");
const db = require("../DB");
const { spawn } = require("node:child_process");
const FF = require("../../lib/ff");

const ALLOWED_EXTS = new Set(["mp4", "mov", "mkv", "webm"]);

const getVideos = (req, res, handleError) => {
  const videos = db.videos.filter((video) => video.userId === req.userId);
  res.json(videos);
};

const uploadVideo = async (req, res, handleErr) => {
  const specefiedFileName = req.headers["filename"];
  if (!specefiedFileName || typeof specefiedFileName !== "string") {
    return handleErr({
      status: 400,
      message: "filename header is required (X-Filename or filename)",
    });
  }
  const extension = path.extname(specefiedFileName).substring(1).toLowerCase();
  if (!ALLOWED_EXTS.has(extension)) {
    return handleErr({
      status: 415,
      message: `Unsupported extention: .${extension}`,
    });
  }

  const name = path.parse(specefiedFileName).name;
  const videoId = crypto.randomBytes(4).toString("hex");
  const folder = path.join(process.cwd(), "storage", videoId);
  const dest = path.join(folder, `original.${extension}`);
  const thumbnailPath = path.join(folder, "thumbnail.jpg");

  try {
    await fsp.mkdir(folder, { recursive: true });
    const ws = fs.createWriteStream(dest, { flags: "wx" });

    await pipeline(req, ws);
    // Make a thumbnail for the video file
    await FF.makeThumbnail(dest, thumbnailPath);

    // Get the dimantion

    const dimensions = await FF.getDimensions(dest, thumbnailPath);

    db.update();
    db.videos.unshift({
      id: db.videos.length,
      videoId,
      name,
      extension,
      userId: req.userId,
      dimensions,
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
};

// Return a video asset to the client
const getVideoAsset = async (req, res, handleErr) => {
  const videoId = req.params.get("videoId");
  const type = req.params.get("type");

  db.update();

  const video = db.videos.find((video) => video.videoId === videoId);

  if (!video) {
    return handleErr({
      status: 404,
      message: "Video not found",
    });
  }

  const folder = path.join(process.cwd(), "storage", videoId);
  let fileHandler;
  let mimeType;
  let fileName; //The final file name for the download (including th extension)

  try {
    switch (type) {
      case "thumbnail":
        fileHandler = await fsp.open(`${folder}/thumbnail.jpg`);
        mimeType = "image/jpeg";
        break;
      // audio
      // resize
      case "resize":
        const dimantion = req.params.get("dimensions"); // dimantion format exe: 1290x720

        fileHandler = await fsp.open(
          `${folder}/${dimantion}.${video.extension}`
        );
        mimeType = `video/${video.extension}`;
        fileName = `${video.name}-${dimantion}.${video.extension}`;
        break;
      case "audio":
        fileHandler = await fsp.open(`${folder}/audio.aac`);
        mimeType = `audio/aac`;
        fileName = `${video.name}-audio.aac`;
        break;
      case "original":
        fileHandler = await fsp.open(`${folder}/original.${video.extension}`);
        mimeType = `video/${video.extension}`;
        fileName = `${video.name}.${video.extension}`;
        break;
    }

    // Grab the file size
    const stat = await fileHandler.stat();

    const fileStream = fileHandler.createReadStream();

    // Set the header to prompt for download
    if (type !== "thumbnail") {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"	`
      );
    }

    // Set the Content-Type header based on the file type
    res.setHeader("Content-Type", mimeType);
    // Set the Content-Length header based on the file type
    res.setHeader("Content-Length", stat.size);

    res.status(200);
    await pipeline(fileStream, res);

    fileHandler.close(); // this is extreamly important. leads to memory issuse
  } catch (err) {
    console.log(err);
  }
};

// Extract the audio for a video file (can only be done once per video)
const extractAudio = async (req, res, handleErr) => {
  const videoId = req.params.get("videoId");
  db.update();

  const video = db.videos.find((video) => video.videoId === videoId);

  if (!video) {
    return handleErr({
      status: 404,
      message: "Video not found",
    });
  }

  const folder = path.join(process.cwd(), "storage", videoId);
  const isAudioExist = video.extractedAudio;

  if (isAudioExist) {
    return handleErr({
      staus: 400,
      message: "The audio has already been extracted for this video.",
    });
  }
  const targetAudioPath = path.join(folder, "audio.aac");
  const originalVideoPath = `${folder}/original.${video.extension}`;
  try {
    await FF.extractAudio(originalVideoPath, targetAudioPath);
    video.extractedAudio = true;
    db.save();

    res.status(200).json({
      status: "success",
      message: "The audio was extracted successfully.",
    });
  } catch (err) {
    util.deleteFile(targetAudioPath);
    return handleErr(err);
  }
};

const resizeVideo = async (req, res, handleErr) => {
  const videoId = req.body.videoId;
  const width = req.body.width;
  const height = req.body.height;
  db.update();

  const video = db.videos.find((video) => videoId === video.videoId);

  if (!video) {
    return handleErr({
      status: 404,
      message: "Video not found",
    });
  }
  const folder = path.join(process.cwd(), "storage", videoId);
  const originalVideoPath = path.join(folder, `original.${video.extension}`);
  const targetVideoPath = path.join(
    folder,
    `${width}x${height}.${video.extension}`
  );
  try {
    video.resizes[`${width}x${height}`] = { processing: true };
    await FF.resizeVideo(originalVideoPath, targetVideoPath, width, height);

    video.resizes[`${width}x${height}`].processing = false;
    db.save();
    res.status(200).json({
      message: "The video is now being proccessed!",
      status: "success",
    });
  } catch (err) {
    util.deleteFile(targetAudioPath);
    video.resizes[`${width}x${height}`].processing = false;
    return handleErr(err);
  }
};

const controller = {
  getVideos,
  uploadVideo,
  getVideoAsset,
  extractAudio,
  resizeVideo,
};

module.exports = controller;
