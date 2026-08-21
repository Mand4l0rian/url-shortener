const { Kafka } = require("@confluentinc/kafka-javascript").KafkaJS;

const kafka = new Kafka({
    kafkaJS: {
        clientId: "url-shortener-api",
        brokers: [process.env.KAFKA_BROKERS],
        ssl: true,
        sasl: {
            mechanism: "plain",
            username: process.env.KAFKA_USERNAME,
            password: process.env.KAFKA_PASSWORD,
        },
    },
});

const producer = kafka.producer();

let isConnected = false;

const connectProducer = async () => {
    if (isConnected) {
        return;
    }

    await producer.connect();
    isConnected = true;

    console.log("Kafka producer connected");
};

const publishClickEvent = async (event) => {
    try {
        if (!isConnected) {
            await connectProducer();
        }

        await producer.send({
            topic: process.env.KAFKA_TOPIC || "url-clicks",
            messages: [
                {
                    key: event.shortCode,
                    value: JSON.stringify(event),
                },
            ],
        });

        console.log(`Kafka click event published: ${event.shortCode}`);
    } catch (error) {
        console.error("Failed to publish Kafka click event:", error.message);
    }
};

const disconnectProducer = async () => {
    if (!isConnected) {
        return;
    }

    await producer.disconnect();
    isConnected = false;

    console.log("Kafka producer disconnected");
};

module.exports = {
    connectProducer,
    publishClickEvent,
    disconnectProducer,
};