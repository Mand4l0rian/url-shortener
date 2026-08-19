const express = require("express");

const {
    createShortUrl,
    redirectUrl
} = require("../controllers/urlController");

const router = express.Router();

router.post("/", createShortUrl);

router.get("/:shortCode", redirectUrl);

module.exports = router;