"use strict";
const { Vendor, VendorDocument, User } = require("../models");
const { Op } = require("sequelize");

// List semua vendor beserta status KYC
const getAllVendors = async (query = {}) => {
  const { search, status_kyc } = query;

  // Buat wadah untuk kondisi filter
  const whereCondition = {};
  // Jika ada query filter status_kyc
  if (status_kyc) {
    whereCondition.status_kyc = status_kyc;
  }
  // Jika ada query pencarian (search nama toko)
  if (search) {
    whereCondition.nama_toko = {
      [Op.iLike]: `%${search}%`, // iLike = case insensitive (tidak peduli huruf besar/kecil)
    };
  }
  const vendors = await Vendor.findAll({
    where: whereCondition, // Masukkan kondisi ke sini
    include: [
      { model: User, as: "user", attributes: ["nama_lengkap", "email"] },
      { model: VendorDocument, as: "documents" },
    ],
    order: [["createdAt", "DESC"]],
  });
  return vendors;
};

// Approve atau Reject KYC vendor
const updateKycStatus = async (vendorId, { status_kyc, catatan_admin }) => {
  const validStatuses = ["pending", "approved", "rejected"];
  if (!validStatuses.includes(status_kyc)) {
    const err = new Error(
      "Status KYC tidak valid. Gunakan: pending, approved, rejected.",
    );
    err.statusCode = 400;
    throw err;
  }

  const vendor = await Vendor.findByPk(vendorId);
  if (!vendor) {
    const err = new Error("Vendor tidak ditemukan.");
    err.statusCode = 404;
    throw err;
  }

  // Update status KYC di vendor
  await vendor.update({ status_kyc });

  // Jika ada catatan admin, update di semua dokumen vendor
  if (catatan_admin) {
    await VendorDocument.update(
      {
        catatan_admin,
        status_verifikasi: status_kyc === "approved" ? "approved" : "rejected",
      },
      { where: { vendor_id: vendorId } },
    );
  }

  return vendor.reload(); // kembalikan data terbaru
};

module.exports = { getAllVendors, updateKycStatus };
