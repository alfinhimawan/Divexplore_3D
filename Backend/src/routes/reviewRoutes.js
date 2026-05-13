"use strict";
const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const authenticate = require("../middlewares/authenticate");

// Memberikan review (harus login)
router.post("/:orderId", authenticate, reviewController.createReview);

// Mengambil review produk (publik)
router.get("/product/:productId", reviewController.getProductReviews);

module.exports = router;
