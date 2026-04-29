"use strict";
const { Vendor, VendorDocument, User } = require("../models");

// Buat profil vendor baru
const createVendor = async (userId, data) => {
  // Cek apakah user sudah punya profil vendor
  const existing = await Vendor.findOne({ where: { user_id: userId } });
  if (existing) {
    const err = new Error("Profil vendor sudah ada.");
    err.statusCode = 409;
    throw err;
  }

  const vendor = await Vendor.create({ user_id: userId, ...data });
  return vendor;
};

// Ambil profil vendor milik user yang login
const getMyVendor = async (userId) => {
  const vendor = await Vendor.findOne({
    where: { user_id: userId },
    include: [{ model: VendorDocument, as: "documents" }],
  });
  if (!vendor) {
    const err = new Error("Profil vendor tidak ditemukan.");
    err.statusCode = 404;
    throw err;
  }
  return vendor;
};

// Update profil vendor
const updateVendor = async (userId, data) => {
  const vendor = await Vendor.findOne({ where: { user_id: userId } });
  if (!vendor) {
    const err = new Error("Profil vendor tidak ditemukan.");
    err.statusCode = 404;
    throw err;
  }
  await vendor.update(data);
  return vendor;
};

// Ambil profil vendor by ID (publik)
const getVendorById = async (vendorId) => {
  const vendor = await Vendor.findByPk(vendorId, {
    include: [{ model: User, as: "user", attributes: ["nama_lengkap"] }],
  });
  if (!vendor) {
    const err = new Error("Vendor tidak ditemukan.");
    err.statusCode = 404;
    throw err;
  }
  return vendor;
};

// Upload dokumen KYC
const uploadDocument = async (vendorId, { jenis_dokumen, file_url }) => {
  const document = await VendorDocument.create({
    vendor_id: vendorId,
    jenis_dokumen,
    file_url,
    status_verifikasi: "pending",
  });
  return document;
};

// Lihat dokumen KYC milik vendor
const getMyDocuments = async (vendorId) => {
  const documents = await VendorDocument.findAll({
    where: { vendor_id: vendorId },
  });
  return documents;
};

module.exports = {
  createVendor,
  getMyVendor,
  updateVendor,
  getVendorById,
  uploadDocument,
  getMyDocuments,
};
