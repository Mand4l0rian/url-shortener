const express = require("express");

const {
    createShortUrl,
    getUrls,
    redirectUrl
} = require("../controllers/urlController");

const router = express.Router();

router.post("/", createShortUrl);

router.get("/", getUrls);

router.get("/:shortCode", redirectUrl);

module.exports = router;