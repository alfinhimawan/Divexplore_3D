"use strict";
const express = require("express");
const router = express.Router();
const vendorController = require("../controllers/vendorController");
const { authenticate, authorize } = require("../middlewares/authenticate");

// Vendor only
router.post(
  "/",
  authenticate,
  authorize("vendor"),
  vendorController.createVendor,
);
router.get(
  "/me",
  authenticate,
  authorize("vendor"),
  vendorController.getMyVendor,
);
router.put(
  "/me",
  authenticate,
  authorize("vendor"),
  vendorController.updateVendor,
);
router.post(
  "/me/documents",
  authenticate,
  authorize("vendor"),
  vendorController.uploadDocument,
);
router.get(
  "/me/documents",
  authenticate,
  authorize("vendor"),
  vendorController.getMyDocuments,
);

// Public (Harus di bawah route spesifik seperti /me)
router.get("/:id", vendorController.getVendorById);

router.post(
  "/me/products/:id/inventory",
  authenticate,
  authorize("vendor"),
  vendorController.manageInventory,
);

router.post(
  "/me/products/:id/cross-selling",
  authenticate,
  authorize("vendor"),
  vendorController.addCrossSellingRule,
);

const withdrawalController = require("../controllers/withdrawalController");

router.get(
  "/me/ledgers",
  authenticate,
  authorize("vendor"),
  vendorController.getMyLedger,
);

// Withdrawal Routes
router.post(
  "/me/withdrawals",
  authenticate,
  authorize("vendor"),
  withdrawalController.requestWithdrawal,
);
router.get(
  "/me/withdrawals",
  authenticate,
  authorize("vendor"),
  withdrawalController.getMyWithdrawals,
);

module.exports = router;
