"use strict";
const Joi = require("joi");
const promoService = require("../services/promoService");

const promoSchema = Joi.object({
  kode_promo: Joi.string().required().uppercase(),
  diskon_persen: Joi.number().integer().min(1).max(100).allow(null),
  max_potongan: Joi.number().min(0).allow(null),
  valid_until: Joi.date().iso().allow(null),
});

const getAllPromos = async (req, res, next) => {
  try {
    const promos = await promoService.getAllPromos();
    res.status(200).json({
      status: "success",
      data: { promos },
    });
  } catch (err) {
    next(err);
  }
};

const createPromo = async (req, res, next) => {
  try {
    const { error, value } = promoSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: "error",
        message: error.details.map((d) => d.message).join(", "),
      });
    }

    const promo = await promoService.createPromo(value);
    res.status(201).json({
      status: "success",
      message: "Promo berhasil dibuat.",
      data: { promo },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllPromos,
  createPromo,
};
