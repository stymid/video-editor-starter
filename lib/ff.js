const { spawn } = require("node:child_process");

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

const extractAudio = async (originalVideoPath, targetAudioPath) => {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-y",
      "-i",
      originalVideoPath,
      "-vn",
      "-acodec",
      "aac",
      "-b:a",
      "192k ",
      targetAudioPath,
    ]);

    ffmpeg.stderr.on("data", (d) => console.log(d.toString("utf8")));
    ffmpeg.on("exit", async (code) => {
      console.log(code);

      if (code !== 0) {
        reject(`Extracting audio exited with this: ${code} code`);
      } else {
        resolve();
      }
    });

    ffmpeg.on("error", (err) => {
      reject(err);
    });
  });
};

const resizeVideo = (originalVideoPath, destfilename, width, height) => {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-i",
      `${originalVideoPath}`,
      "-vf",
      `scale=${width}:${height}`,
      `${destfilename}`,
    ]);

    ffmpeg.on("exit", (code) => {
      if (code !== 0)
        return reject(`Resizing video exited with this: ${code} code`);
      resolve();
    });
  });
};

module.exports = { makeThumbnail, getDimensions, extractAudio, resizeVideo };
