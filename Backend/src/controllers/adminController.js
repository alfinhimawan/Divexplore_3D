"use strict";
const Joi = require("joi");
const adminService = require("../services/adminService");
const marketingService = require("../services/marketingService");

const kycSchema = Joi.object({
  status_kyc: Joi.string()
    .valid("pending", "approved", "rejected")
    .required()
    .messages({
      "any.only":
        "Status KYC harus salah satu dari: pending, approved, rejected.",
    }),
  catatan_admin: Joi.string().optional().allow(null, ""),
});

// GET /api/admin/vendors
const getAllVendors = async (req, res, next) => {
  try {
    // Tangkap query parameter dari URL
    const { search, status_kyc } = req.query;
    // Kirim ke service
    const vendors = await adminService.getAllVendors({ search, status_kyc });

    res.status(200).json({
      status: "success",
      data: { vendors, total: vendors.length },
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/vendors/:id/kyc
const updateKycStatus = async (req, res, next) => {
  try {
    const { error, value } = kycSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return res.status(400).json({
        status: "error",
        message: error.details.map((d) => d.message).join(", "),
      });
    }

    const vendor = await adminService.updateKycStatus(req.params.id, value);
    res.status(200).json({
      status: "success",
      message: `Status KYC berhasil diubah menjadi '${value.status_kyc}'.`,
      data: { vendor },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/abandoned-carts
const getAbandonedCarts = async (req, res, next) => {
  try {
    const orders = await adminService.getAbandonedCarts();
    res.status(200).json({
      status: "success",
      data: { orders, total: orders.length },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/reports/gmv
const getGmvReport = async (req, res, next) => {
  try {
    const report = await adminService.getGmvReport();
    res.status(200).json({
      status: "success",
      data: report,
    });
  } catch (err) {
    next(err);
  }
};


// POST /api/admin/marketing/trigger (Trigger Strategi Notifikasi Otomatis)
const triggerMarketing = async (req, res, next) => {
  try {
    const report = await marketingService.triggerMarketingStrategy();

    res.status(200).json({
      status: "success",
      message: "Strategi marketing otomatis berhasil dijalankan.",
      data: { report },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllVendors,
  updateKycStatus,
  getAbandonedCarts,
  getGmvReport,
  triggerMarketing,
};
