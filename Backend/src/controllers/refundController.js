"use strict";
const Joi = require("joi");
const refundService = require("../services/refundService");

const refundRequestSchema = Joi.object({
  alasan_refund: Joi.string().min(10).required().messages({
    "string.min": "Alasan refund minimal 10 karakter.",
    "any.required": "Alasan refund wajib diisi.",
  }),
});

const adminProcessSchema = Joi.object({
  status: Joi.string().valid("approved", "rejected").required(),
  catatan_admin: Joi.string().allow(null, ""),
});

// POST /api/orders/:id/refund
const requestRefund = async (req, res, next) => {
  try {
    const { error, value } = refundRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ status: "error", message: error.details[0].message });
    }

    const refund = await refundService.requestRefund(req.user.id, req.params.id, value);

    res.status(201).json({
      status: "success",
      message: "Pengajuan refund berhasil dikirim. Menunggu review admin.",
      data: { refund },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/:id/refund-status
const getRefundStatus = async (req, res, next) => {
  try {
    const refund = await refundService.getRefundStatus(req.user.id, req.params.id);
    res.status(200).json({
      status: "success",
      data: { refund },
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/refunds/:id
const processRefund = async (req, res, next) => {
  try {
    const { error, value } = adminProcessSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ status: "error", message: error.details[0].message });
    }

    const refund = await refundService.processRefund(req.params.id, value);

    res.status(200).json({
      status: "success",
      message: `Refund berhasil di-${value.status}.`,
      data: { refund },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  requestRefund,
  getRefundStatus,
  processRefund,
};
