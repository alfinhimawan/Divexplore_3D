"use strict";
const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { authenticate, authorize } = require("../middlewares/authenticate");

const reviewController = require("../controllers/reviewController");

// Public Routes — Tidak memerlukan login
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);
router.get("/:productId/reviews", reviewController.getProductReviews);

// Protected Routes — Memerlukan login & role vendor
router.post(
  "/",
  authenticate,
  authorize("vendor"),
  productController.createProduct,
);
router.put(
  "/:id",
  authenticate,
  authorize("vendor"),
  productController.updateProduct,
);
router.delete(
  "/:id",
  authenticate,
  authorize("vendor"),
  productController.deleteProduct,
);
router.post(
  "/:id/bundling",
  authenticate,
  authorize("vendor"),
  productController.addBundling,
);

// BARU: Mencatat kunjungan produk (untuk Retargeting)
router.post("/:id/visit", authenticate, productController.logVisit);

// Add-on Management (ProductAddon CRUD)
const addonController = require("../controllers/addonController");

// Public: Wisatawan bisa lihat add-on sebelum checkout
router.get("/:productId/addons", addonController.getAddons);

// Vendor Only: Kelola add-on produk
router.post(
  "/:productId/addons",
  authenticate,
  authorize("vendor"),
  addonController.createAddon,
);
router.put(
  "/:productId/addons/:addonId",
  authenticate,
  authorize("vendor"),
  addonController.updateAddon,
);
router.delete(
  "/:productId/addons/:addonId",
  authenticate,
  authorize("vendor"),
  addonController.deleteAddon,
);

module.exports = router;
