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
router.post(
  "/:orderId/reviews",
  authorize("wisatawan"),
  reviewController.createReview,
);

// Vendor Routes
router.get("/vendor", authorize("vendor"), orderController.getVendorOrders);

// Admin Routes
router.get("/admin", authorize("admin"), orderController.getAdminOrders);

module.exports = router;
