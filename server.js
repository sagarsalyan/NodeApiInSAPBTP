const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

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


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});