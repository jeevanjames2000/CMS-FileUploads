const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  url: { type: String, required: true },
  tags: { type: [String], required: true },
});

module.exports = mongoose.model("Image", imageSchema);
