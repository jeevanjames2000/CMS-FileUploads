const mongoose = require("mongoose");
const videoSchema = new mongoose.Schema(
  {
    youtubeId: { type: String, required: true },
    name: { type: String, required: true },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Video", videoSchema);
