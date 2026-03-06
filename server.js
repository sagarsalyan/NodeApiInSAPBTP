const express = require("express");
const multer = require("multer");
const AdmZip = require("adm-zip");
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


// ✅ Route 2: Accept image & return actual image in response
app.post("/image-return", upload.single("image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No image file uploaded" });
    }

    console.log("Image received:", req.file.originalname);

    // Set proper response headers
    res.set("Content-Type", req.file.mimetype);
    res.set("Content-Disposition", `attachment; filename="${req.file.originalname}"`);

    // Send the raw image buffer
    res.send(req.file.buffer);
});


// -------------------------
// NEW ROUTE: Zip → Extract PDFs → Return ZIP
// -------------------------

app.post("/extract-pdf-zip", upload.single("zipfile"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No zip file uploaded" });
    }

    try {
        const AdmZip = require("adm-zip");

        // Load uploaded zip
        const uploadedZip = new AdmZip(req.file.buffer);

        // Create new zip for PDFs
        const pdfZip = new AdmZip();
        let pdfCount = 0;

        uploadedZip.getEntries().forEach((entry) => {
            if (!entry.isDirectory && entry.entryName.toLowerCase().endsWith(".pdf")) {
                pdfZip.addFile(entry.entryName, entry.getData());
                pdfCount++;
            }
        });

        if (pdfCount === 0) {
            return res.status(404).json({ message: "No PDF files found in uploaded ZIP" });
        }

        // Create ZIP buffer
        const outputZipBuffer = pdfZip.toBuffer();

        // 🔥 IMPORTANT: these headers force download
        res.setHeader("Content-Type", "application/zip");
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="pdf-files.zip"'
        );
        res.setHeader("Content-Length", outputZipBuffer.length);

        // Send file buffer
        return res.send(outputZipBuffer);

    } catch (error) {
        console.error("ZIP processing error:", error);
        res.status(500).json({ message: "Error processing uploaded ZIP" });
    }
});

//Cleanup ui5 
app.post("/cleanup-js-zip", upload.single("zipfile"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No zip file uploaded" });
    }

    try {
        const AdmZip = require("adm-zip");

        // Load uploaded ZIP
        const uploadedZip = new AdmZip(req.file.buffer);
        const entries = uploadedZip.getEntries();

        // Output ZIP
        const outputZip = new AdmZip();

        // Group JS files by base name (after removing "-dbg")
        const jsGroups = {};

        entries.forEach((entry) => {
            if (entry.isDirectory) return;

            const name = entry.entryName;

            if (name.toLowerCase().endsWith(".js")) {
                const normalized = name.replace("-dbg", "");

                if (!jsGroups[normalized]) {
                    jsGroups[normalized] = [];
                }

                jsGroups[normalized].push(entry);
            } else {
                // Add non-JS files as-is
                outputZip.addFile(entry.entryName, entry.getData());
            }
        });

        // Process JS groups
        Object.keys(jsGroups).forEach((normalizedName) => {
            const group = jsGroups[normalizedName];

            if (group.length === 1) {
                const file = group[0];
                const finalName = file.entryName.replace("-dbg", "");
                outputZip.addFile(finalName, file.getData());
            } else {
                const dbgFile = group.find(f => f.entryName.includes("-dbg"));

                if (dbgFile) {
                    const finalName = normalizedName;
                    outputZip.addFile(finalName, dbgFile.getData());
                }
            }
        });

        // -----------------------------------------
        // ADD ROOT TEMPLATE FILES TO OUTPUT ZIP
        // -----------------------------------------

        outputZip.addFile(
            "mta.yaml",
            Buffer.from(
                "ID: sample-mta\n_schema-version: 3.1\nversion: 1.0.0\n",
                "utf-8"
            )
        );

        outputZip.addFile(
            "xs-app.json",
            Buffer.from(
                JSON.stringify(
                    {
                        welcomeFile: "index.html",
                        routes: []
                    },
                    null,
                    2
                ),
                "utf-8"
            )
        );

        outputZip.addFile(
            "xs-security.json",
            Buffer.from(
                JSON.stringify(
                    {
                        xsappname: "sample-security",
                        "tenant-mode": "shared"
                    },
                    null,
                    2
                ),
                "utf-8"
            )
        );

        // -----------------------------------------

        const resultBuffer = outputZip.toBuffer();

        res.setHeader("Content-Type", "application/zip");
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="cleaned-js.zip"'
        );
        res.setHeader("Content-Length", resultBuffer.length);

        res.send(resultBuffer);

    } catch (error) {
        console.error("ZIP cleanup error:", error);
        res.status(500).json({ message: "Error cleaning ZIP" });
    }
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});