const path = require("path");
const multer = require("multer");
const sharp = require("sharp");
const Image = require("../models/Image");
const fs = require("fs");
const storage = multer.memoryStorage();
const upload = multer({ storage });
const UPLOADS_DIR = path.join(__dirname, "../uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
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

            // Optimize image and save to disk
            const optimizedBuffer = await sharp(file.buffer)
              .resize(800, 600)
              .webp({ quality: 80 })
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
};
