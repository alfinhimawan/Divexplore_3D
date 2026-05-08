"use strict";
const Joi = require("joi");
const withdrawalService = require("../services/withdrawalService");
const { Vendor } = require("../models");

const withdrawalRequestSchema = Joi.object({
  jumlah: Joi.number().min(50000).required().messages({
    "number.min": "Minimal penarikan adalah Rp 50.000",
  }),
  nama_bank: Joi.string().required(),
  nomor_rekening: Joi.string().required(),
  nama_pemilik_rekening: Joi.string().required(),
});

const adminWithdrawalSchema = Joi.object({
  status: Joi.string().valid("processed", "rejected").required(),
  bukti_transfer_url: Joi.string().when("status", {
    is: "processed",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});

// POST /api/vendors/me/withdrawals
const requestWithdrawal = async (req, res, next) => {
  try {
    const { error, value } = withdrawalRequestSchema.validate(req.body);
    if (error) return res.status(400).json({ status: "error", message: error.details[0].message });

    // Cari ID Vendor dari User yang sedang login
    const vendor = await Vendor.findOne({ where: { user_id: req.user.id } });
    if (!vendor) return res.status(403).json({ status: "error", message: "Anda bukan akun vendor." });

    const withdrawal = await withdrawalService.requestWithdrawal(vendor.id, value);

    res.status(201).json({
      status: "success",
      message: "Permintaan penarikan dana berhasil dikirim.",
      data: { withdrawal },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/vendors/me/withdrawals
const getMyWithdrawals = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ where: { user_id: req.user.id } });
    if (!vendor) return res.status(403).json({ status: "error", message: "Anda bukan akun vendor." });

    const withdrawals = await withdrawalService.getVendorWithdrawals(vendor.id);
    res.status(200).json({
      status: "success",
      data: { withdrawals },
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/withdrawals/:id
const processWithdrawal = async (req, res, next) => {
  try {
    const { error, value } = adminWithdrawalSchema.validate(req.body);
    if (error) return res.status(400).json({ status: "error", message: error.details[0].message });

    const withdrawal = await withdrawalService.processWithdrawal(req.params.id, value);

    res.status(200).json({
      status: "success",
      message: `Withdrawal berhasil di-${value.status}.`,
      data: { withdrawal },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/withdrawals (Admin Only)
const getAllWithdrawals = async (req, res, next) => {
  try {
    const { status } = req.query;
    const withdrawals = await withdrawalService.getAllWithdrawals({ status });
    res.status(200).json({
      status: "success",
      data: { withdrawals, total: withdrawals.length },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  requestWithdrawal,
  getMyWithdrawals,
  processWithdrawal,
  getAllWithdrawals,
};
