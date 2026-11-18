const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
  },
  { timestamps: true }
);

// $lookup join + "ekjon user-er post" list (newest age)
postSchema.index({ author: 1, _id: -1 });

module.exports = mongoose.model("Post", postSchema);