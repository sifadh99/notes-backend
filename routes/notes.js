const router = require("express").Router();
const mongoose = require("mongoose");
const Note = require("../models/Note");
const { auth } = require("../middleware/auth");
const paginate = require("../utils/paginate");

router.use(auth);

const validId = (req, res, next) =>
  mongoose.isValidObjectId(req.params.id)
    ? next()
    : res.status(400).json({ message: "Invalid id" });

router.post("/", async (req, res) => {
  const { title, content } = req.body;
  if (!title) return res.status(400).json({ message: "title dao" });
  const note = await Note.create({ owner: req.user.id, title, content });
  res.status(201).json(note);
});

router.get("/", async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = { owner: req.user.id };
  const [data, total] = await Promise.all([
    Note.find(filter).sort({ _id: -1 }).skip(skip).limit(limit),
    Note.countDocuments(filter),
  ]);
  res.json({ data, page, limit, total, pages: Math.ceil(total / limit) });
});

router.get("/:id", validId, async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, owner: req.user.id });
  if (!note) return res.status(404).json({ message: "Not found" });
  res.json(note);
});

router.put("/:id", validId, async (req, res) => {
  const { title, content } = req.body;
  const note = await Note.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.id },
    { $set: { ...(title && { title }), ...(content !== undefined && { content }) } },
    { new: true }
  );
  if (!note) return res.status(404).json({ message: "Not found" });
  res.json(note);
});

router.delete("/:id", validId, async (req, res) => {
  const note = await Note.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  if (!note) return res.status(404).json({ message: "Not found" });
  res.json({ message: "Deleted" });
});

module.exports = router;