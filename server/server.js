require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const { connectRedis } = require("./config/redis");
const {
    connectProducer,
    disconnectProducer
} = require("./kafka/producer");

connectDB();
connectRedis();

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

const server = app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);

    await connectProducer();
});

const shutdown = async () => {
    console.log("Shutting down server...");

    await disconnectProducer();

    server.close(() => {
        console.log("Server closed");
        process.exit(0);
    });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);