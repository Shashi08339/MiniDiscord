
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  socketId: String,
  username: String,
  room: String,
  role: String,
  status: String,
});

module.exports = mongoose.model("User", UserSchema);
