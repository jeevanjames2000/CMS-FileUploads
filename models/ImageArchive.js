const mongoose = require("mongoose");

const ImageArchiveSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  url: { type: String, default: "" },
  image: {
    data: Buffer,
    contentType: String,
  },
  tags: { type: [String], default: [] },
});

module.exports = mongoose.model("ImageArchive", ImageArchiveSchema);
