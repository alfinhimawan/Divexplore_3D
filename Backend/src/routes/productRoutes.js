"use strict";
const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { authenticate, authorize } = require("../middlewares/authenticate");

// Public Routes — Tidak memerlukan login
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);

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
router.post(
  "/:id/visit",
  authenticate,
  productController.logVisit,
);

module.exports = router;
