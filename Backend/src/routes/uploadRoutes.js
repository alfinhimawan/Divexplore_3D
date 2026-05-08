"use strict";
const express = require("express");
const router = express.Router();
const uploadController = require("../controllers/uploadController");
const { authenticate, authorize } = require("../middlewares/authenticate");
const {
  uploadProfile,
  uploadProduct,
  uploadPanorama,
  uploadDocument,
  upload3DAsset,
} = require("../middlewares/upload");

// Semua rute upload dilindungi (Minimal harus login)
router.use(authenticate);

// 1. Upload Foto Profil (Semua User)
router.post(
  "/profile",
  uploadProfile.single("file"),
  uploadController.uploadFile,
);

// 2. Upload Foto Produk / Logo Toko (Hanya Vendor)
router.post(
  "/product",
  authorize("vendor"),
  uploadProduct.single("file"),
  uploadController.uploadFile,
);

// 3. Upload Dokumen KYC (Hanya Vendor)
router.post(
  "/document",
  authorize("vendor"),
  uploadDocument.single("file"),
  uploadController.uploadFile,
);

// 4. Upload Panorama 360 (Hanya Admin)
router.post(
  "/panorama",
  authorize("admin"),
  uploadPanorama.single("file"),
  uploadController.uploadFile,
);

// 5. Upload Aset 3D (.glb) (Hanya Admin)
router.post(
  "/3d-model",
  authorize("admin"),
  upload3DAsset.single("file"),
  uploadController.uploadFile,
);

module.exports = router;
