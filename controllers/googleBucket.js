const multer = require("multer");
const cors = require("cors");
const express = require("express");
const app = express();
app.use(cors());
const {
  uploadFileToDrive,
  listFilesFromDrive,
} = require("../controllers/driveService");
require("dotenv").config();
const storage = multer.memoryStorage();
const upload = multer({ storage });
const IMAGE_FOLDER_ID = process.env.GOOGLE_DRIVE_IMAGE_FOLDER_ID;
const VIDEO_FOLDER_ID = process.env.GOOGLE_DRIVE_VIDEO_FOLDER_ID;
const uploadImages = async (req, res) => {
  console.log("called");
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const fileLink = await uploadFileToDrive(req.file, IMAGE_FOLDER_ID);
    return res.json({ success: true, fileLink });
  } catch (error) {
    res.status(500).json({ error: "Error uploading image" });
  }
};

const uploadVideos = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const fileLink = await uploadFileToDrive(req.file, VIDEO_FOLDER_ID);
    return res.json({ success: true, fileLink });
  } catch (error) {
    res.status(500).json({ error: "Error uploading video" });
  }
};
const getImagesFromDrive = async (req, res) => {
  try {
    const images = await listFilesFromDrive(IMAGE_FOLDER_ID, "image/");
    return res.json(images);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving images" });
  }
};
const getVideosFromDrive = async (req, res) => {
  try {
    const videos = await listFilesFromDrive(VIDEO_FOLDER_ID, "video/");
    return res.json(videos);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving videos" });
  }
};
module.exports = {
  upload,
  uploadImages,
  uploadVideos,
  getImagesFromDrive,
  getVideosFromDrive,
};
