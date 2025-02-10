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
const axios = require("axios");

router.get("/images/proxy", async (req, res) => {
  try {
    const images = await listFilesFromDrive(IMAGE_FOLDER_ID, "image/");
    const imageData = await Promise.all(
      images.map(async (image) => {
        const response = await axios.get(image.url, {
          responseType: "arraybuffer",
        });
        return {
          name: image.name,
          data: Buffer.from(response.data, "binary").toString("base64"),
          mimeType: response.headers["content-type"],
        };
      })
    );
    res.json(imageData);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving images" });
  }
});

module.exports = router;
