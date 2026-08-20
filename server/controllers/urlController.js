const crypto = require("crypto");
const URL = require("../models/URL");

const createShortUrl = async (req, res, next) => {
    try {
        const { originalUrl } = req.body;

        if (!originalUrl) {
            return res.status(400).json({
                message: "Original URL is required"
            });
        }

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
            shortUrl: `http://localhost:5000/${url.shortCode}`
        });

    } catch (error) {
        next(error);
      }
};

const redirectUrl = async (req, res, next) => {
    try {
        const { shortCode } = req.params;

        const url = await URL.findOne({ shortCode });

        if (!url) {
          const error = new Error("Short URL not found");
          error.statusCode = 404;
          return next(error);
        }

        if (url.expiresAt < new Date()) {
          const error = new Error("This URL has expired");
          error.statusCode = 410;
          return next(error);
      }
        url.clicks += 1;
        await url.save();

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

    res.status(200).json({
      message: "URL deleted successfully"
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
    createShortUrl,
    redirectUrl,
    getUrls,
    deleteUrl
};