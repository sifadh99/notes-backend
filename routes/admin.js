const router = require("express").Router();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");
const Note = require("../models/Note");
const { auth, requireRole } = require("../middleware/auth");
const paginate = require("../utils/paginate");

router.use(auth, requireRole("admin"));

const validId = (req, res, next) =>
  mongoose.isValidObjectId(req.params.id)
    ? next()
    : res.status(400).json({ message: "Invalid id" });

router.get("/users", async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const [data, total] = await Promise.all([
    User.find().sort({ _id: -1 }).skip(skip).limit(limit),
    User.estimatedDocumentCount(),
  ]);
  res.json({ data, page, limit, total, pages: Math.ceil(total / limit) });
});

router.get("/users/:id", validId, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "Not found" });
  res.json(user);
});

router.post("/users", async (req, res) => {
  try {
    const { name, email, password, role, interests } = req.body;
    if (!name || !email || !password || password.length < 6)
      return res.status(400).json({ message: "name, email, password (min 6) dao" });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role, interests });
    const { passwordHash: _ph, ...safe } = user.toObject();
    res.status(201).json(safe);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: "Email already used" });
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/users/:id", validId, async (req, res) => {
  try {
    const { name, email, password, role, interests } = req.body;
    const update = {};
    if (name) update.name = name;
    if (email) update.email = String(email).toLowerCase().trim();
    if (role && ["user", "admin"].includes(role)) update.role = role;
    if (Array.isArray(interests)) update.interests = interests;
    if (password) {
      if (password.length < 6) return res.status(400).json({ message: "Password min 6" });
      update.passwordHash = await bcrypt.hash(password, 10);
    }
    const user = await User.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!user) return res.status(404).json({ message: "Not found" });
    res.json(user);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: "Email already used" });
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/users/:id", validId, async (req, res) => {
  if (req.params.id === req.user.id)
    return res.status(400).json({ message: "Nijeke delete kora jabe na" });
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: "Not found" });
  await Note.deleteMany({ owner: user._id });
  res.json({ message: "Deleted" });
});

router.get("/notes", async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = {};
  if (req.query.owner) {
    if (!mongoose.isValidObjectId(req.query.owner))
      return res.status(400).json({ message: "Invalid owner" });
    filter.owner = req.query.owner;
  }
  const [data, total] = await Promise.all([
    Note.find(filter).sort({ _id: -1 }).skip(skip).limit(limit),
    Note.countDocuments(filter),
  ]);
  res.json({ data, page, limit, total, pages: Math.ceil(total / limit) });
});

module.exports = router;