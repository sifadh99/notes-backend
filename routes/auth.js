const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const sign = (u) =>
  jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET, { expiresIn: "1d" });

const pub = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, interests } = req.body;
    if (!name || !email || !password || password.length < 6)
      return res.status(400).json({ message: "name, email, password (min 6) dao" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, interests });
    res.status(201).json({ token: sign(user), user: pub(user) });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: "Email already used" });
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email).toLowerCase() }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      return res.status(401).json({ message: "Invalid credentials" });
    res.json({ token: sign(user), user: pub(user) });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;