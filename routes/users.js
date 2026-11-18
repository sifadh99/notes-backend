const router = require("express").Router();
const mongoose = require("mongoose");
const User = require("../models/User");
const { auth } = require("../middleware/auth");
const paginate = require("../utils/paginate");

// Nijer profile
router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "Not found" });
  res.json(user);
});

// SCENARIO 1: interest onujayi user group (ekta User.aggregate() call)
// Optional filter: ?interest=chess
router.get("/interests", auth, async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const interest = req.query.interest
    ? String(req.query.interest).toLowerCase().trim()
    : null;

  const pipeline = [];
  if (interest) pipeline.push({ $match: { interests: interest } }); // index use kore
  pipeline.push({ $unwind: "$interests" });
  if (interest) pipeline.push({ $match: { interests: interest } }); // shudhu oi interest-er group
  pipeline.push(
    {
      $group: {
        _id: "$interests",
        count: { $sum: 1 },
        users: { $push: { _id: "$_id", name: "$name" } },
      },
    },
    { $sort: { count: -1, _id: 1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        interest: "$_id",
        count: 1,
        users: { $slice: ["$users", 20] },
      },
    }
  );

  const data = await User.aggregate(pipeline);
  res.json({ data, page, limit });
});

// SCENARIO 2: ekjon user-er shob post ($lookup, ekta pipeline-e). Public.
router.get("/:id/posts", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ message: "Invalid id" });
  const { page, limit, skip } = paginate(req.query);

  const result = await User.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(req.params.id) } },
    {
      $lookup: {
        from: "posts",
        localField: "_id",
        foreignField: "author",
        pipeline: [{ $sort: { _id: -1 } }, { $skip: skip }, { $limit: limit }],
        as: "posts",
      },
    },
    { $project: { name: 1, posts: 1 } },
  ]);

  if (!result.length) return res.status(404).json({ message: "User not found" });
  res.json({ ...result[0], page, limit });
});

module.exports = router;