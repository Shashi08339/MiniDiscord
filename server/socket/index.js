const Message = require("../models/Message");
const { Server } = require("socket.io");
const formatTime = require("../utils/time");

const roomPasswords = {};
const roomUsers = {};
const MAX_HISTORY = 50;

module.exports = (server) => {
  const io = new Server(server);

  io.on("connection", (socket) => {
    console.log("✅ User connected");

    // JOIN ROOM
    socket.on("join-room", async ({ room, password, username }) => {
      if (!room || !password || !username) return;

      if (!roomPasswords[room]) {
        roomPasswords[room] = password;
      }

      if (roomPasswords[room] !== password) {
        socket.emit("join-failed", "Wrong password for this room.");
        return;
      }

      socket.join(room);
      socket.currentRoom = room;
      socket.username = username;

      if (!roomUsers[room]) roomUsers[room] = [];

      const role = roomUsers[room].length === 0 ? "admin" : "user";

      roomUsers[room].push({
        id: socket.id,
        username,
        status: "online",
        role,
      });

      // 🔥 LOAD MESSAGES FROM MONGODB
      const messages = await Message.find({ room })
        .sort({ _id: 1 })
        .limit(MAX_HISTORY);

      socket.emit("join-success", {
        room,
        users: roomUsers[room],
        messages,
        yourId: socket.id,
      });

      const joinMsg = new Message({
        room,
        username: "⚡",
        text: `${username} joined the chat`,
        time: formatTime(),
        system: true,
        reactions: {},
      });

      await joinMsg.save();
      io.to(room).emit("message", joinMsg);
      io.to(room).emit("room-users", roomUsers[room]);
    });

    // TEXT MESSAGE
    socket.on("message", async ({ room, text }) => {
      if (!room || !text || !socket.username) return;

      const msg = new Message({
        room,
        username: socket.username,
        text,
        time: formatTime(),
        system: false,
        reactions: {},
        ownerId: socket.id,
      });

      await msg.save();
      io.to(room).emit("message", msg);
    });

    // DISCONNECT
    socket.on("disconnect", async () => {
      const room = socket.currentRoom;
      if (!room || !roomUsers[room]) return;

      const user = roomUsers[room].find((u) => u.id === socket.id);
      if (user) user.status = "offline";

      io.to(room).emit("room-users", roomUsers[room]);

      if (socket.username) {
        const leaveMsg = new Message({
          room,
          username: "⚡",
          text: `${socket.username} left the chat`,
          time: formatTime(),
          system: true,
          reactions: {},
        });

        await leaveMsg.save();
        io.to(room).emit("message", leaveMsg);
      }
    });
  });
};
