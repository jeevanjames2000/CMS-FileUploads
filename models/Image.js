const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  url: { type: String },
  image: {
    data: Buffer,
    contentType: String,
  },
  tags: { type: [String], required: true },
});

module.exports = mongoose.model("Image", imageSchema);
