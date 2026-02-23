const multer = require("multer");

module.exports = (app) => {
  const uploadDir = "uploads";

  const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, unique + "-" + file.originalname);
    },
  });

  const upload = multer({ storage });

  app.post("/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file" });
    }

    res.json({
      url: "/uploads/" + req.file.filename,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
    });
  });
};
