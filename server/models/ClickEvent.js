const mongoose = require("mongoose");

const clickEventSchema = new mongoose.Schema(
    {
        eventId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        eventType: {
            type: String,
            required: true,
            default: "URL_CLICKED",
        },

        shortCode: {
            type: String,
            required: true,
            index: true,
        },

        originalUrl: {
            type: String,
            required: true,
        },

        timestamp: {
            type: Date,
            required: true,
            index: true,
        },

        userAgent: {
            type: String,
            default: null,
        },

        referer: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("ClickEvent", clickEventSchema);