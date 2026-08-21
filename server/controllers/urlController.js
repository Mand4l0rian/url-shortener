const crypto = require("crypto");
const URL = require("../models/URL");
const { redisClient } = require("../config/redis");
const { publishClickEvent } = require("../kafka/producer");

const createShortUrl = async (req, res, next) => {
    try {
        const { originalUrl } = req.body;
        const shortCode = crypto.randomBytes(4).toString("hex");
        const expiresAt = new Date(Date.now() + 7 * 60 * 60 * 1000);

        const url = await URL.create({
            originalUrl,
            shortCode,
            expiresAt,
        });

        res.status(201).json({
            originalUrl: url.originalUrl,
            shortCode: url.shortCode,
            shortUrl: `${process.env.BASE_URL}/${url.shortCode}`,
        });
    } catch (error) {
        next(error);
    }
};

const publishUrlClickEvent = (req, urlData) => {
    const event = {
        eventId: crypto.randomUUID(),
        eventType: "URL_CLICKED",
        shortCode: urlData.shortCode || req.params.shortCode,
        originalUrl: urlData.originalUrl,
        timestamp: new Date().toISOString(),
        userAgent: req.get("user-agent") || null,
        referer: req.get("referer") || null,
    };

    // Fire-and-forget:
    // Kafka failure should never prevent the user from being redirected.
    publishClickEvent(event).catch((error) => {
        console.error("Kafka analytics event failed:", error.message);
    });
};

const redirectUrl = async (req, res, next) => {
    try {
        const { shortCode } = req.params;

        // 1. Check Redis first
        const cachedUrl = await redisClient.get(`url:${shortCode}`);

        if (cachedUrl) {
            const urlData = JSON.parse(cachedUrl);

            // 2. Check expiration from cached data
            if (new Date(urlData.expiresAt) < new Date()) {
                await redisClient.del(`url:${shortCode}`);

                const error = new Error("This URL has expired");
                error.statusCode = 410;
                return next(error);
            }

            // 3. Increment clicks atomically in MongoDB
            await URL.findOneAndUpdate(
                { shortCode },
                { $inc: { clicks: 1 } }
            );

            // 4. Publish analytics event to Kafka
            publishUrlClickEvent(req, {
                ...urlData,
                shortCode,
            });

            // 5. Redirect
            return res.redirect(urlData.originalUrl);
        }

        // 6. Cache MISS → MongoDB
        const url = await URL.findOne({ shortCode });

        if (!url) {
            const error = new Error("Short URL not found");
            error.statusCode = 404;
            return next(error);
        }

        // 7. Check expiration
        if (url.expiresAt < new Date()) {
            const error = new Error("This URL has expired");
            error.statusCode = 410;
            return next(error);
        }

        // 8. Increment clicks atomically
        await URL.findOneAndUpdate(
            { shortCode },
            { $inc: { clicks: 1 } }
        );

        // 9. Publish analytics event to Kafka
        publishUrlClickEvent(req, {
            shortCode: url.shortCode,
            originalUrl: url.originalUrl,
        });

        // 10. Calculate remaining lifetime
        const remainingSeconds = Math.ceil(
            (url.expiresAt.getTime() - Date.now()) / 1000
        );

        // 11. Cache URL only if it still has time left
        if (remainingSeconds > 0) {
            await redisClient.set(
                `url:${shortCode}`,
                JSON.stringify({
                    originalUrl: url.originalUrl,
                    expiresAt: url.expiresAt,
                }),
                {
                    EX: remainingSeconds,
                }
            );
        }

        // 12. Redirect
        res.redirect(url.originalUrl);

    } catch (error) {
        next(error);
    }
};

const getUrls = async (req, res, next) => {
    try {
        const urls = await URL.find().sort({ createdAt: -1 });

        res.status(200).json(urls);
    } catch (error) {
        next(error);
    }
};

const deleteUrl = async (req, res, next) => {
    try {
        const { id } = req.params;

        const url = await URL.findByIdAndDelete(id);

        if (!url) {
            const error = new Error("URL not found");
            error.statusCode = 404;
            return next(error);
        }

        // Remove the URL from Redis cache
        await redisClient.del(`url:${url.shortCode}`);

        res.status(200).json({
            message: "URL deleted successfully",
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    createShortUrl,
    redirectUrl,
    getUrls,
    deleteUrl,
};