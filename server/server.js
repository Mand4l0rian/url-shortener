require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");

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
    res.json({
        message: "URL Shortener API is running"
    });
});

const urlRoutes = require("./routes/urlRoutes");
const { redirectUrl } = require("./controllers/urlController");

app.use("/api/urls", urlRoutes);

app.get("/:shortCode", redirectUrl);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

let analyticsWorker = null;

const startAnalyticsWorker = () => {
    console.log("Starting Kafka analytics worker...");

    analyticsWorker = spawn(
        process.execPath,
        [path.join(__dirname, "workers", "analyticsWorker.js")],
        {
            env: process.env,
            stdio: "inherit"
        }
    );

    analyticsWorker.on("error", (error) => {
        console.error(
            "Failed to start analytics worker:",
            error.message
        );
    });

    analyticsWorker.on("exit", (code, signal) => {
        console.log(
            `Analytics worker exited with code ${code} and signal ${signal}`
        );

        analyticsWorker = null;
    });
};

const server = app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);

    try {
        await connectProducer();
        console.log("Kafka producer connected");

        startAnalyticsWorker();
    } catch (error) {
        console.error(
            "Failed to initialize Kafka services:",
            error.message
        );
    }
});

const shutdown = async () => {
    console.log("Shutting down server...");

    // Stop analytics worker
    if (analyticsWorker) {
        console.log("Stopping analytics worker...");

        analyticsWorker.kill("SIGTERM");

        analyticsWorker = null;
    }

    // Disconnect Kafka producer
    await disconnectProducer();

    // Close HTTP server
    server.close(() => {
        console.log("Server closed");
        process.exit(0);
    });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);