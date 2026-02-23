const mongoose = require("mongoose");

module.exports = async function connectDB() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/major_chat_app");
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed", err);
    process.exit(1);
  }
};
