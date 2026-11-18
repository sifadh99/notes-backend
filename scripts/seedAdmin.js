require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error("ADMIN_EMAIL ar ADMIN_PASSWORD .env-e dao");
  const passwordHash = await bcrypt.hash(password, 10);
  await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { $set: { name: "Admin", passwordHash, role: "admin" } },
    { upsert: true, new: true }
  );
  console.log("Admin ready:", email);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });