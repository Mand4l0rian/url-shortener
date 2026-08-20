const express = require("express");
const rateLimit = require("express-rate-limit");
const validateUrl = require("../middleware/validateUrl");

const {
    createShortUrl,
    getUrls,
    redirectUrl,
    deleteUrl
} = require("../controllers/urlController");

const router = express.Router();

const createUrlLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: {
      message: "Too many URL creation requests. Try again later."
    }
  });

  router.post("/", createUrlLimiter, validateUrl, createShortUrl);

router.get("/", getUrls);

router.delete("/:id", deleteUrl);

module.exports = router;