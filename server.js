const express = require("express");
const multer = require("multer");
const app = express();
const port = process.env.PORT || 3000;


// Multer setup (store file in memory)
const upload = multer({ storage: multer.memoryStorage() });


app.get("/", (req, res) => {
  res.send("Running!!");
});


// Middleware to parse JSON body
app.use(express.json());



// POST route that accepts an object
app.post("/print", (req, res) => {
    const body = req.body;

    console.log("Received object:", body);

    res.json({
        message: "Object received successfully",
        received: body
    });
});


// ✅ NEW: Route to upload image and return Base64
app.post("/image-to-base64", upload.single("image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No image file uploaded" });
    }

    // Convert buffer to base64 string
    const base64String = req.file.buffer.toString("base64");

    console.log("Image received:", req.file.originalname);

    res.json({
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        base64: base64String
    });
});



app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});