"use strict";
const Joi = require("joi");
const adminService = require("../services/adminService");

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

// GET /api/admin/abandoned-carts (WP-7.1.2)
// Digunakan oleh marketing untuk mem-follow up wisatawan yang tidak menyelesaikan pembayaran
const getAbandonedCarts = async (req, res, next) => {
  try {
    const { Order, User } = require("../models");
    // Cari keranjang yang 'pending' (belum dibayar)
    const abandonedOrders = await Order.findAll({
      where: { status: "pending" },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["nama_lengkap", "email", "no_telepon"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      status: "success",
      data: { orders: abandonedOrders, total: abandonedOrders.length },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/reports/gmv (WP-7.1.3)
// Laporan total pendapatan kotor dan bersih platform
const getGmvReport = async (req, res, next) => {
  try {
    const { VirtualLedger, sequelize } = require("../models");

    const result = await VirtualLedger.findOne({
      attributes: [
        [sequelize.fn("SUM", sequelize.col("pendapatan_kotor")), "total_gmv"],
        [
          sequelize.fn("SUM", sequelize.col("potongan_komisi")),
          "total_komisi_platform",
        ],
        [
          sequelize.fn("SUM", sequelize.col("biaya_midtrans")),
          "total_biaya_midtrans",
        ],
      ],
      raw: true,
    });

    res.status(200).json({
      status: "success",
      data: {
        total_gmv: result.total_gmv || 0,
        total_komisi_platform: result.total_komisi_platform || 0,
        total_biaya_midtrans: result.total_biaya_midtrans || 0,
      },
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
};
