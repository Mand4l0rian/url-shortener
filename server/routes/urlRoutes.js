const express = require("express");

const {
    createShortUrl,
    getUrls,
    redirectUrl,
    deleteUrl
} = require("../controllers/urlController");

const router = express.Router();

router.post("/", createShortUrl);

router.get("/", getUrls);

router.delete("/:id", deleteUrl);

module.exports = router;