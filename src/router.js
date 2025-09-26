// Controllers
const User = require("./controllers/user");
const Video = require("./controllers/video");

module.exports = (server) => {
  // ------------------------------------------------ //
  // ************ USER ROUTES ************* //
  // ------------------------------------------------ //

  // Log a user in and give them a token
  server.route("post", "/api/login", User.logUserIn);

  // Log a user out
  server.route("delete", "/api/logout", User.logUserOut);

  // Send user info
  server.route("get", "/api/user", User.sendUserInfo);

  // Update a user info
  server.route("put", "/api/user", User.updateUser);

  // MY test route
  server.route("get", "/api/myroute", User.myRout);

  // ------------------------------------------------ //
  // ************ VIDEO ROUTES ************* //
  // ------------------------------------------------ //

  server.route("get", "/api/videos", Video.getVideos);

  // Upload a video file
  server.route("post", "/api/upload-video", Video.uploadVideo);

  // Send a video asset
  server.route("get", "/get-video-asset", Video.getVideoAsset);

  // Reaize a video file (create a new video)
  server.route("put", "/api/video/resize", Video.resizeVideo);

  // Send an audio  /api/video/extract-audio
  server.route("patch", "/api/video/extract-audio", Video.extractAudio);

  // ------------------------------------------------ //
  // ************ HANDLE FAKE ROUTES ************* //
  // ------------------------------------------------ //

  server.route(
    "get",
    "/.well-known/appspecific/com.chrome.devtools.json",
    (req, res) => {
      res.json({ devtools: "ok" });
    }
  );
};
