const multer = require("multer");
const cloudinary = require("../Utils/cloudinary");
const streamifier = require("streamifier");
const express = require("express");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  let stream = cloudinary.uploader.upload_stream({ folder: "uploads" }, (error, result) => {
    if (error) return res.status(500).json({ error });
    res.json({ url: result.secure_url });
  });

  streamifier.createReadStream(req.file.buffer).pipe(stream);
});

module.exports = router;
