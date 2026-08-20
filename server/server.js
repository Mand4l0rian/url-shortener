const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
  
dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "URL Shortener API is running" });
});

const urlRoutes = require("./routes/urlRoutes");
const { redirectUrl } = require("./controllers/urlController");

app.use("/api/urls", urlRoutes);

app.get("/:shortCode", redirectUrl);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});