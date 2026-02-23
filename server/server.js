const connectDB = require("./config/db");
connectDB();


const express = require("express");
const http = require("http");
const path = require("path");

const app = express();
const server = http.createServer(app);

// frontend
app.use(express.static(path.join(__dirname, "../public")));

// uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// routes
require("./routes/upload")(app);

// sockets
require("./socket")(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
