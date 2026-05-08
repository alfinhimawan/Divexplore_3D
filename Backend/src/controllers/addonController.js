"use strict";
const Joi = require("joi");
const addonService = require("../services/addonService");

const addonSchema = Joi.object({
  nama_addon: Joi.string().min(2).max(100).required().messages({
    "any.required": "Nama add-on wajib diisi.",
  }),
  harga: Joi.number().positive().required().messages({
    "number.positive": "Harga harus bernilai positif.",
    "any.required": "Harga add-on wajib diisi.",
  }),
  deskripsi: Joi.string().max(255).optional().allow(null, ""),
});

// GET /api/products/:productId/addons
const getAddons = async (req, res, next) => {
  try {
    const addons = await addonService.getAddonsByProduct(req.params.productId);
    res.status(200).json({ status: "success", data: { addons } });
  } catch (err) {
    next(err);
  }
};

// POST /api/products/:productId/addons
const createAddon = async (req, res, next) => {
  try {
    const { error, value } = addonSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        status: "error",
        message: error.details.map((d) => d.message).join(", "),
      });
    }
    const addon = await addonService.createAddon(req.user.id, req.params.productId, value);
    res.status(201).json({ status: "success", message: "Add-on berhasil ditambahkan.", data: { addon } });
  } catch (err) {
    next(err);
  }
};

// PUT /api/products/:productId/addons/:addonId
const updateAddon = async (req, res, next) => {
  try {
    const { error, value } = addonSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        status: "error",
        message: error.details.map((d) => d.message).join(", "),
      });
    }
    const addon = await addonService.updateAddon(req.user.id, req.params.productId, req.params.addonId, value);
    res.status(200).json({ status: "success", message: "Add-on berhasil diperbarui.", data: { addon } });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/products/:productId/addons/:addonId
const deleteAddon = async (req, res, next) => {
  try {
    await addonService.deleteAddon(req.user.id, req.params.productId, req.params.addonId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = { createAddon, getAddons, updateAddon, deleteAddon };
