const express = require("express");
const {
  upload,
  uploadImages,
  uploadVideos,
  getImagesFromDrive,
  getVideosFromDrive,
} = require("../controllers/googleBucket");

const router = express.Router();

router.post("/upload/image", upload.single("file"), uploadImages);
router.post("/upload/video", upload.single("file"), uploadVideos);
router.get("/images", getImagesFromDrive);
router.get("/videos", getVideosFromDrive);

module.exports = router;
