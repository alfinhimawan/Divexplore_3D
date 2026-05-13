"use strict";
const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { authenticate } = require("../middlewares/authenticate");

// Memberikan review (harus login)
router.post("/:orderId", 
  (req, res, next) => authenticate(req, res, next), 
  (req, res, next) => reviewController.createReview(req, res, next)
);

// Mengambil review produk (publik)
router.get("/product/:productId", (req, res, next) => reviewController.getProductReviews(req, res, next));

module.exports = router;
