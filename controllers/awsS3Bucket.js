const path = require("path");
const multer = require("multer");
const sharp = require("sharp");
const Image = require("../models/Image");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();
const s3 = new S3Client({
  region: "",
  credentials: {
    accessKeyId: "",
    secretAccessKey: "",
  },
});
const bucketName = "";
const storage = multer.memoryStorage();
const upload = multer({ storage });
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
            const optimizedBuffer = await sharp(file.buffer)
              .resize(800, 600)
              .webp({ quality: 80 })
              .toBuffer();
            const params = {
              Bucket: bucketName,
              Key: `uploads/${uniqueFilename}`,
              Body: optimizedBuffer,
              ContentType: "image/webp",
              ACL: "public-read",
            };
            await s3.send(new PutObjectCommand(params));
            const s3Url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/uploads/${uniqueFilename}`;
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
};
