"use strict";
const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { authenticate, authorize } = require("../middlewares/authenticate");

const reviewController = require("../controllers/reviewController");

// Semua route order wajib login
router.use(authenticate);

// Wisatawan routes
router.post("/", authorize("wisatawan"), orderController.createOrder);
router.get("/me", authorize("wisatawan"), orderController.getMyOrders);
router.get(
  "/:id/invoice",
  authorize("wisatawan"),
  orderController.downloadInvoice,
);
router.post("/:orderId/reviews", authorize("wisatawan"), reviewController.createReview);

// (Opsional nanti ditambahkan GET /vendors/orders untuk vendor melihat pesanan masuk)

module.exports = router;
