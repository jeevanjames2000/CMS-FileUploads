const path = require("path");
const multer = require("multer");
const Image = require("../models/Image");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });
module.exports = {
  uploadImages: (req, res) => {
    upload.array("images", 5)(req, res, async (err) => {
      console.log("err: ", err);
      if (err) return res.status(500).send({ error: "Error uploading files" });
      if (!req.files || req.files.length === 0)
        return res.status(400).send({ error: "No files uploaded" });
      const fileUrls = req.files.map((file) => {
        return `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;
      });
      const tags = req.body.tags || [];
      try {
        const images = req.files.map((file) => ({
          filename: file.filename,
          url: `${req.protocol}://${req.get("host")}/uploads/${file.filename}`,
          tags,
        }));
        await Image.insertMany(images);
        res
          .status(200)
          .send({ message: "Files uploaded successfully", fileUrls });
      } catch (error) {
        res.status(500).send({ error: "Database error" });
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
