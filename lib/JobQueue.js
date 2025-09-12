const db = require("../src/DB");
const FF = require("./ff");
const util = require("./util");
const path = require("node:path");

class JobQueue {
  constructor() {
    this.jobs = [];
    this.currentJob = null;

    db.videos.forEach((video) => {
      Object.keys(video.resizes).forEach((resize) => {
        const [width, height] = resize.split("x");
        if (video.resizes[resize].processing) {
          console.log(width, height);
          this.enqueue({
            type: "resize",
            videoId: video.videoId,
            width,
            height,
          });
        }
      });
    });
  }

  enqueue(job) {
    if (job.type === "resize") {
      db.update();
      const { videoId, width, height } = job;
      const video = db.videos.find((video) => videoId === video.videoId);
      video.resizes[`${width}x${height}`] = { processing: true };
      db.save();
      console.log("The uncomplited resize", job, "added to the queue");
    }
    this.jobs.push(job);
    this.executeNext();
  }

  dequeue() {
    return this.jobs.shift();
  }

  executeNext() {
    // dequeue
    if (this.currentJob) return;
    this.currentJob = this.dequeue();
    if (!this.currentJob) return;
    this.execute(this.currentJob);
  }

  async execute(job) {
    if (job.type === "resize") {
      db.update();
      const { videoId, width, height } = job;
      const video = db.videos.find((video) => videoId === video.videoId);

      const folder = path.join(process.cwd(), "storage", videoId);
      const originalVideoPath = path.join(
        folder,
        `original.${video.extension}`
      );
      const targetVideoPath = path.join(
        folder,
        `${width}x${height}.${video.extension}`
      );

      try {
        console.log("start", job);

        await FF.resizeVideo(originalVideoPath, targetVideoPath, width, height);

        db.update();
        const video = db.videos.find((video) => videoId === video.videoId);
        video.resizes[`${width}x${height}`].processing = false;
        db.save();
        console.log(
          "Done resizing! number of jobs remaining",
          this.jobs.length
        );
      } catch (err) {
        util.deleteFile(targetVideoPath);
        video.resizes[`${width}x${height}`].processing = false;
        db.save();
      }
    }
    this.currentJob = null;
    this.executeNext();
  }
}
module.exports = JobQueue;
