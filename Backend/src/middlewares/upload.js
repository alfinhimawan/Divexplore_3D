"use strict";
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// 1. Storage untuk Foto Profil (Wisatawan, Vendor)
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "Divexplore_3D/Profiles",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});

// 2. Storage untuk Produk & Logo (Khusus Vendor)
const productStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "Divexplore_3D/Products",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});

// 3. Storage untuk Panorama 360 (Khusus Admin)
const panoramaStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "Divexplore_3D/Panoramas",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});

// 4. Storage untuk Dokumen KYC (KTP, NIB)
const documentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "Divexplore_3D/Documents",
    allowed_formats: ["pdf", "jpg", "png", "jpeg"],
    resource_type: "auto", // Penting untuk PDF
  },
});

// 5. Storage untuk Aset 3D (glb, gltf)
const asset3dStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "Divexplore_3D/Assets3D",
    allowed_formats: ["glb", "gltf"],
    resource_type: "raw", // Penting untuk aset 3D agar file tidak corrupt
  },
});

// Setup Multer dengan limit file size
const uploadProfile = multer({ storage: profileStorage, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadProduct = multer({ storage: productStorage, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadPanorama = multer({ storage: panoramaStorage, limits: { fileSize: 10 * 1024 * 1024 } });
const uploadDocument = multer({ storage: documentStorage, limits: { fileSize: 10 * 1024 * 1024 } });
const upload3DAsset = multer({ storage: asset3dStorage, limits: { fileSize: 30 * 1024 * 1024 } });

module.exports = {
  uploadProfile,
  uploadProduct,
  uploadPanorama,
  uploadDocument,
  upload3DAsset,
};
