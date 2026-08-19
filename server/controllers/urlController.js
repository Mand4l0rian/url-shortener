const crypto = require("crypto");
const URL = require("../models/URL");

const createShortUrl = async (req, res) => {
    try {
        const { originalUrl } = req.body;

        if (!originalUrl) {
            return res.status(400).json({
                message: "Original URL is required"
            });
        }

        const shortCode = crypto.randomBytes(4).toString("hex");

        const url = await URL.create({
            originalUrl,
            shortCode
        });

        res.status(201).json({
            originalUrl: url.originalUrl,
            shortCode: url.shortCode,
            shortUrl: `http://localhost:5000/${url.shortCode}`
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const redirectUrl = async (req, res) => {
    try {
        const { shortCode } = req.params;

        const url = await URL.findOne({ shortCode });

        if (!url) {
            return res.status(404).json({
                message: "Short URL not found"
            });
        }

        url.clicks += 1;
        await url.save();

        res.redirect(url.originalUrl);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const getUrls = async (req, res) => {
    try {
      const urls = await URL.find().sort({ createdAt: -1 });
  
      res.status(200).json(urls);
    } catch (error) {
      console.error(error);
  
      res.status(500).json({
        message: "Server error"
      });
    }
  };

const deleteUrl = async (req, res) => {
  try {
    const { id } = req.params;

    const url = await URL.findByIdAndDelete(id);

    if (!url) {
      return res.status(404).json({
        message: "URL not found"
      });
    }

    res.status(200).json({
      message: "URL deleted successfully"
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error"
    });
  }
};

module.exports = {
    createShortUrl,
    redirectUrl,
    getUrls,
    deleteUrl
};