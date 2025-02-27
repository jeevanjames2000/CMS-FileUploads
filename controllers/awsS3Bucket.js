const path = require("path");
const multer = require("multer");
const sharp = require("sharp");
const dotenv = require("dotenv");
const Image = require("../models/Image");
const fs = require("fs");
const {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} = require("@aws-sdk/client-s3");
require("dotenv").config();
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});
const bucketName = process.env.AWS_BUCKET_NAME;
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueFilename = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueFilename);
  },
});
const upload = multer({ storage });
const checkS3Files = async () => {
  const command = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: "uploads/",
  });
  const { Contents } = await s3.send(command);
};
module.exports = {
  uploadImages: (req, res) => {
    upload.array("images", 5)(req, res, async (err) => {
      if (err) return res.status(500).send({ error: "Error uploading files" });
      if (!req.files || req.files.length === 0)
        return res.status(400).send({ error: "No files uploaded" });
      try {
        const uploadedImages = await Promise.all(
          req.files.map(async (file) => {
            const uniqueFilename = `${Date.now()}-${file.originalname.replace(
              /\.[^/.]+$/,
              ".webp"
            )}`;
            const optimizedBuffer = await sharp(file.path)
              .webp({ quality: 70 })
              .toBuffer();
            const params = {
              Bucket: bucketName,
              Key: `uploads/${uniqueFilename}`,
              Body: optimizedBuffer,
              ContentType: "image/webp",
              ACL: "public-read",
            };
            await s3.send(new PutObjectCommand(params));
            fs.unlinkSync(file.path);
            const s3Url = `https://${bucketName}.s3.amazonaws.com/uploads/${uniqueFilename}`;
            return {
              filename: uniqueFilename,
              url: s3Url,
              tags: req.body.tags || [],
            };
          })
        );
        await Image.insertMany(uploadedImages);
        const fileUrls = uploadedImages.map((image) => image.url);
        res.status(200).send({
          message: "Files uploaded successfully",
          fileUrls,
        });
      } catch (error) {
        console.error("Error uploading images to S3:", error);
        res.status(500).send({ error: "Error uploading images to S3" });
      }
    });
  },
  getImagesS3: async (req, res) => {
    try {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: "uploads/",
      });
      const { Contents } = await s3.send(command);
      const images = Contents
        ? Contents.map((file) => ({
            url: `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.Key}`,
            key: file.Key,
          }))
        : [];
      res.status(200).send(images);
    } catch (error) {
      console.error("Error fetching images from S3:", error);
      res.status(500).send({ error: "Error fetching images from S3" });
    }
  },
  getImages: async (req, res) => {
    try {
      const images = await Image.find({}, "url");
      if (!images || images.length === 0) {
        return res.status(404).send({ message: "No images found." });
      }
      const imageUrls = images.map((image) => image.url);
      res.status(200).send({ success: true, images: imageUrls });
    } catch (error) {
      console.error("Error fetching images from MongoDB:", error);
      res.status(500).send({ error: "Internal server error" });
    }
  },
  deleteImage: async (req, res) => {
    try {
      let { key } = req.body;
      key = decodeURIComponent(key);
      const keyParts = key.split("/");
      const extractedKey = keyParts[keyParts.length - 1];
      const s3Key = `uploads/${extractedKey}`;
      await s3.send(
        new DeleteObjectCommand({ Bucket: bucketName, Key: s3Key })
      );
      await Image.deleteOne({ filename: extractedKey });
      res.status(200).send({ message: "Image deleted successfully" });
    } catch (error) {
      console.error("Error deleting image from S3:", error);
      res.status(500).send({ error: "Error deleting image from S3" });
    }
  },
  deleteBulkImages: async (req, res) => {
    try {
      const { keys } = req.body;
      if (!keys || !Array.isArray(keys)) {
        return res.status(400).send({ error: "Invalid request format" });
      }
      const objectsToDelete = keys.map((key) => ({ Key: key }));
      const response = await s3.send(
        new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: { Objects: objectsToDelete },
        })
      );
      if (response.Errors && response.Errors.length > 0) {
        console.error("Errors deleting objects:", response.Errors);
        return res
          .status(500)
          .send({ error: "Partial failure deleting objects from S3" });
      }
      await Image.deleteMany({ filename: { $in: keys } });
      res.status(200).send({ message: "Images deleted successfully" });
    } catch (error) {
      console.error("Error deleting images from S3:", error);
      res.status(500).send({ error: "Error deleting images from S3" });
    }
  },
};
