const path = require("path");
const multer = require("multer");
const sharp = require("sharp");
const Image = require("../models/Image");
const ImageArchive = require("../models/ImageArchive");
const Video = require("../models/uploadCMS");
const mongoose = require("mongoose");
const fs = require("fs");
const storage = multer.memoryStorage();
const upload = multer({ storage });
const UPLOADS_DIR = path.join(__dirname, "../uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
const deleteLocalImage = (filename) => {
  const filePath = path.join(__dirname, "../uploads", filename);
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("Error deleting image:", err);
    } else {
    }
  });
};
const extractYouTubeId = (url) => {
  const match = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  );
  return match ? match[1] : null;
};
module.exports = {
  uploadImages: (req, res) => {
    upload.array("images", 5)(req, res, async (err) => {
      if (err) return res.status(500).send({ error: "Error uploading files" });
      if (!req.files || req.files.length === 0)
        return res.status(400).send({ error: "No files uploaded" });
      try {
        const optimizedImages = await Promise.all(
          req.files.map(async (file) => {
            const uniqueFilename = `${Date.now()}-${file.originalname.replace(
              /\.[^/.]+$/,
              ".webp"
            )}`;
            const outputFilePath = path.join(UPLOADS_DIR, uniqueFilename);
            const optimizedBuffer = await sharp(file.buffer)
              .resize(800, 600, { fit: "inside", withoutEnlargement: true })
              .webp({ lossless: true, quality: 100 })
              .toBuffer();
            fs.writeFileSync(outputFilePath, optimizedBuffer);
            return {
              filename: uniqueFilename,
              url: `${req.protocol}://${req.get(
                "host"
              )}/uploads/${uniqueFilename}`,
              tags: req.body.tags || [],
            };
          })
        );
        await Image.insertMany(optimizedImages);
        const fileUrls = optimizedImages.map((image) => image.url);
        res
          .status(200)
          .send({ message: "Files uploaded successfully", fileUrls });
      } catch (error) {
        console.error("Error optimizing images:", error);
        res.status(500).send({ error: "Error optimizing images" });
      }
    });
  },
  getImage: async (req, res) => {
    const searchTerm = req.params.name;
    try {
      const images = await Image.find({
        filename: { $regex: searchTerm, $options: "i" },
      });
      if (!images.length)
        return res.status(404).send({ error: "Image(s) not found" });
      const image = images[0];
      res.sendFile(path.join(__dirname, "../uploads", image.filename));
    } catch (error) {
      res.status(500).send({ error: "Error fetching image" });
    }
  },
  getAllImages: async (req, res) => {
    try {
      const images = await Image.find();
      if (!images.length)
        return res.status(404).send({ error: "No images found" });
      res.status(200).send(images);
    } catch (error) {
      res.status(500).send({ error: "Error fetching images" });
    }
  },
  deleteLocalImage: async (req, res) => {
    const { filenames } = req.body;
    if (!filenames || filenames.length === 0) {
      return res.status(400).send({ error: "No filenames provided." });
    }
    try {
      for (const filename of filenames) {
        deleteLocalImage(filename);
        await Image.deleteOne({ filename });
      }
      res.status(200).send({
        message: "Images deleted successfully",
        deletedFiles: filenames,
      });
    } catch (error) {
      console.error("Error deleting images:", error);
      res.status(500).send({ error: "Error deleting images" });
    }
  },
  uploadMongoImages: (req, res) => {
    upload.array("images", 5)(req, res, async (err) => {
      if (err) return res.status(500).json({ error: "Error uploading files" });
      if (!req.files || req.files.length === 0)
        return res.status(400).json({ error: "No files uploaded" });
      try {
        const savedImages = await Promise.all(
          req.files.map(async (file) => {
            const optimizedBuffer = await sharp(file.buffer)
              .resize(800, 600, { fit: "inside", withoutEnlargement: true })
              .webp({ quality: 90 })
              .toBuffer();
            const filename = `${Date.now()}-${file.originalname.replace(
              /\.[^/.]+$/,
              ".webp"
            )}`;
            const newImage = new Image({
              filename,
              url: "",
              image: {
                data: optimizedBuffer,
                contentType: "image/webp",
              },
              tags: req.body.tags || [],
            });
            await newImage.save();
            const newArchivedImage = new ImageArchive({
              filename,
              url: "",
              image: {
                data: optimizedBuffer,
                contentType: "image/webp",
              },
              tags: req.body.tags || [],
            });
            await newArchivedImage.save();
            return newImage._id;
          })
        );
        res.status(200).json({
          message: "Files uploaded successfully",
          imageIds: savedImages,
        });
      } catch (error) {
        console.error("Error processing images:", error);
        res.status(500).json({ error: "Error processing images" });
      }
    });
  },
  getMongoImage: async (req, res) => {
    try {
      const archivedImages = await ImageArchive.find({}, "filename image");
      if (!archivedImages || archivedImages.length === 0) {
        return res.status(404).json({ error: "No archived images found" });
      }
      const imagesWithBase64 = archivedImages.map((image) => ({
        _id: image._id,
        filename: image.filename,
        contentType: image.image.contentType,
        imageUrl: `data:${
          image.image.contentType
        };base64,${image.image.data.toString("base64")}`,
      }));
      res.status(200).json(imagesWithBase64);
    } catch (error) {
      console.error("Error fetching archived images:", error);
      res.status(500).json({ error: "Error fetching archived images" });
    }
  },
  uploadCMS: async (req, res) => {
    try {
      let { youtubeId, name } = req.body;
      youtubeId = extractYouTubeId(youtubeId);

      if (!youtubeId) {
        return res.status(400).json({ message: "Invalid YouTube URL" });
      }

      const existingVideo = await Video.findOne({ youtubeId });
      if (existingVideo) {
        return res
          .status(400)
          .json({ message: "File already exists. Choose another File." });
      }

      const lastVideo = await Video.findOne().sort({ order: -1 });
      const lastOrder =
        lastVideo && !isNaN(lastVideo.order) ? lastVideo.order : 0;
      const newOrder = lastOrder + 1;

      const newVideo = new Video({ youtubeId, name, order: newOrder });
      await newVideo.save();

      res
        .status(201)
        .json({ message: "Video uploaded successfully", video: newVideo });
    } catch (error) {
      console.error("Error uploading video:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  getCMS: async (req, res) => {
    try {
      const videos = await Video.find().sort({ createdAt: -1 });
      res.status(200).json(videos);
    } catch (error) {
      console.error("Error fetching videos:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  deleteYoutube: async (req, res) => {
    const { youtubeIds } = req.body;
    if (!youtubeIds || youtubeIds.length === 0) {
      return res.status(400).send({ error: "No filenames provided." });
    }
    try {
      const deleteResult = await Video.deleteMany({
        youtubeId: { $in: youtubeIds },
      });
      if (deleteResult.deletedCount === 0) {
        return res
          .status(404)
          .send({ message: "No matching videos found for deletion." });
      }
      res.status(200).send({
        message: "Videos deleted successfully",
        deletedCount: deleteResult.deletedCount,
        deletedFiles: youtubeIds,
      });
    } catch (error) {
      console.error("Error deleting videos:", error);
      res.status(500).send({ error: "Error deleting videos" });
    }
  },
};
