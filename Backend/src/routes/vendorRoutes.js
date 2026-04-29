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

module.exports = router;
