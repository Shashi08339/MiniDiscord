const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  room: String,
  username: String,
  text: String,
  time: String,
  system: Boolean,
  edited: Boolean,
  deleted: Boolean,
  reactions: Object,
  ownerId: String,
  fileUrl: String,
  fileName: String,
  fileType: String,
});

module.exports = mongoose.model("Message", MessageSchema);
