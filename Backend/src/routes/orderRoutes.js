"use strict";
const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { authenticate, authorize } = require("../middlewares/authenticate");

const reviewController = require("../controllers/reviewController");

// Semua route order wajib login
router.use(authenticate);

const refundController = require("../controllers/refundController");

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

// Refund routes (Wisatawan)
router.post(
  "/:id/refund",
  authorize("wisatawan"),
  refundController.requestRefund,
);
router.get(
  "/:id/refund-status",
  authorize("wisatawan"),
  refundController.getRefundStatus,
);

// Vendor Routes
router.get("/vendor", authorize("vendor"), orderController.getVendorOrders);

// Admin Routes
router.get("/admin", authorize("admin"), orderController.getAdminOrders);

module.exports = router;
