const router = require("express").Router();
const User = require("../models/User");
const { auth } = require("../middleware/auth");

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "Not found" });
  res.json(user);
});

module.exports = router;