require("dotenv").config();

const { Kafka } = require("@confluentinc/kafka-javascript").KafkaJS;
const mongoose = require("mongoose");
const ClickEvent = require("../models/ClickEvent");

const kafka = new Kafka({
    kafkaJS: {
        clientId: "url-shortener-analytics-worker",
        brokers: [process.env.KAFKA_BROKERS],
        ssl: true,
        sasl: {
            mechanism: "plain",
            username: process.env.KAFKA_USERNAME,
            password: process.env.KAFKA_PASSWORD,
        },
    },
});

const consumer = kafka.consumer({
    groupId: "url-shortener-analytics",
});

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Analytics worker connected to MongoDB");

        await consumer.connect();
        console.log("Analytics consumer connected to Kafka");

        await consumer.subscribe({
            topic: process.env.KAFKA_TOPIC || "url-clicks",
            fromBeginning: true,
        });

        console.log("Analytics worker subscribed to url-clicks");

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    const event = JSON.parse(message.value.toString());

                    console.log("Processing click event:", {
                        eventId: event.eventId,
                        shortCode: event.shortCode,
                        timestamp: event.timestamp,
                    });

                    await ClickEvent.create({
                        eventId: event.eventId,
                        eventType: event.eventType,
                        shortCode: event.shortCode,
                        originalUrl: event.originalUrl,
                        timestamp: event.timestamp,
                        userAgent: event.userAgent,
                        referer: event.referer,
                    });

                    console.log(
                        `Analytics event stored: ${event.eventId}`
                    );

                } catch (error) {
                    if (error.code === 11000) {
                        console.log(
                            "Duplicate event ignored:",
                            error.message
                        );
                        return;
                    }

                    console.error(
                        "Failed to process click event:",
                        error.message
                    );
                }
            },
        });
    } catch (error) {
        console.error("Analytics worker failed:", error);
        process.exit(1);
    }
};

const shutdown = async () => {
    console.log("Shutting down analytics worker...");

    try {
        await consumer.disconnect();
        await mongoose.disconnect();
    } catch (error) {
        console.error("Shutdown error:", error.message);
    }

    process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

run();