"use strict";
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authenticate, authorize } = require("../middlewares/authenticate");

// Semua route admin wajib login + role admin
router.use(authenticate, authorize("admin"));

// GET /api/admin/vendors
router.get("/vendors", adminController.getAllVendors);

// PUT /api/admin/vendors/:id/kyc
router.put("/vendors/:id/kyc", adminController.updateKycStatus);

// GET /api/admin/abandoned-carts
router.get("/abandoned-carts", adminController.getAbandonedCarts);

// GET /api/admin/reports/gmv
router.get("/reports/gmv", adminController.getGmvReport);

const refundController = require("../controllers/refundController");

// POST /api/admin/marketing/trigger
router.post("/marketing/trigger", adminController.triggerMarketing);

const withdrawalController = require("../controllers/withdrawalController");

// Refund Management
router.get("/refunds", refundController.getAllRefunds);
router.put("/refunds/:id", refundController.processRefund);

// Withdrawal Management
router.get("/withdrawals", withdrawalController.getAllWithdrawals);
router.put("/withdrawals/:id", withdrawalController.processWithdrawal);

module.exports = router;
