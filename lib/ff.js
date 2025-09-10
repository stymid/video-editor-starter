const { spawn } = require("node:child_process");
const { resolve } = require("node:path");

const makeThumbnail = (fullPath, thumbnailPath) => {
  // ffmpeg -i video.mp4 -ss 5 -vframes 1 thumbnail.jpg
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-i",
      fullPath,
      "-ss",
      "5",
      "-vframes",
      "1",
      thumbnailPath,
    ]);

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(`makeThumbnail exited with ${code}`);
      }
    });

    ffmpeg.on("error", (err) => reject(err));
  });
};

const getDimensions = (fullPath) => {
  // ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 input.mp4
  return new Promise((resolve, reject) => {
    let dimention = "";
    const ffprobe = spawn("ffprobe", [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height",
      "-of",
      "csv=p=0",
      fullPath,
    ]);
    ffprobe.stdout.on("data", (data) => {
      dimention += data;
    });

    ffprobe.on("close", (code) => {
      if (code === 0) {
        dimention = dimention.replace(/\n/g, "").split(",");
        resolve({
          width: dimention[0],
          height: dimention[1],
        });
      } else reject(`makeThumbnail exited with ${code}`);
    });

    ffprobe.on("error", (err) => reject(err));
  });
};

module.exports = { makeThumbnail, getDimensions };
