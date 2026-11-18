const router = require("express").Router();
const Post = require("../models/Post");
const { auth } = require("../middleware/auth");
const paginate = require("../utils/paginate");

// Post likho (login lagbe)
router.post("/", auth, async (req, res) => {
  const { title, body } = req.body;
  if (!title || !body) return res.status(400).json({ message: "title ar body dao" });
  const post = await Post.create({ author: req.user.id, title, body });
  res.status(201).json(post);
});

// Shobar post dekho (public, paginated)
router.get("/", async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const [data, total] = await Promise.all([
    Post.find().sort({ _id: -1 }).skip(skip).limit(limit),
    Post.estimatedDocumentCount(),
  ]);
  res.json({ data, page, limit, total, pages: Math.ceil(total / limit) });
});

module.exports = router;