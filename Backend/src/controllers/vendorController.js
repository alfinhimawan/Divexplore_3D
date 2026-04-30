"use strict";
const Joi = require("joi");
const vendorService = require("../services/vendorService");

// Schema validasi
const vendorSchema = Joi.object({
  nama_toko: Joi.string().min(2).max(100).required(),
  nama_penanggung_jawab: Joi.string().min(2).max(100).required(),
  no_telepon_bisnis: Joi.string().min(8).max(20).required(),
  kategori: Joi.string().required(),
  alamat_lengkap: Joi.string().min(10).required(),
  link_google_maps: Joi.string().uri().required().messages({
    "string.uri": "Link Google Maps harus berupa URL yang valid.",
  }),
  logo_url: Joi.string().uri().optional().allow(null, ""),
});

const updateVendorSchema = Joi.object({
  nama_toko: Joi.string().min(2).max(100),
  nama_penanggung_jawab: Joi.string().min(2).max(100),
  no_telepon_bisnis: Joi.string().min(8).max(20),
  kategori: Joi.string(),
  alamat_lengkap: Joi.string().min(10),
  link_google_maps: Joi.string().uri(),
  logo_url: Joi.string().uri().optional().allow(null, ""),
}).min(1); // minimal 1 field yang diubah

const documentSchema = Joi.object({
  jenis_dokumen: Joi.string()
    .valid("KTP", "NIB", "Sertifikat_Selam")
    .required()
    .messages({
      "any.only":
        "Jenis dokumen harus salah satu dari: KTP, NIB, Sertifikat_Selam.",
    }),
  file_url: Joi.string().uri().required().messages({
    "string.uri": "File URL harus berupa URL yang valid.",
  }),
});

const manageInventorySchema = Joi.object({
  tanggal_ketersediaan: Joi.date().iso().required(),
  available_qty: Joi.number().integer().min(0).required(),
});

const crossSellingSchema = Joi.object({
  addon_id: Joi.string().uuid().required(),
});

// POST /api/vendors
const createVendor = async (req, res, next) => {
  try {
    const { error, value } = vendorSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return res.status(400).json({
        status: "error",
        message: error.details.map((d) => d.message).join(", "),
      });
    }

    const vendor = await vendorService.createVendor(req.user.id, value);

    res.status(201).json({
      status: "success",
      message: "Profil vendor berhasil dibuat.",
      data: { vendor },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/vendors/me
const getMyVendor = async (req, res, next) => {
  try {
    const vendor = await vendorService.getMyVendor(req.user.id);
    res.status(200).json({ status: "success", data: { vendor } });
  } catch (err) {
    next(err);
  }
};

// PUT /api/vendors/me
const updateVendor = async (req, res, next) => {
  try {
    const { error, value } = updateVendorSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return res.status(400).json({
        status: "error",
        message: error.details.map((d) => d.message).join(", "),
      });
    }

    const vendor = await vendorService.updateVendor(req.user.id, value);
    res.status(200).json({
      status: "success",
      message: "Profil vendor berhasil diperbarui.",
      data: { vendor },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/vendors/:id
const getVendorById = async (req, res, next) => {
  try {
    const vendor = await vendorService.getVendorById(req.params.id);
    res.status(200).json({ status: "success", data: { vendor } });
  } catch (err) {
    next(err);
  }
};

// POST /api/vendors/me/documents
const uploadDocument = async (req, res, next) => {
  try {
    const { error, value } = documentSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return res.status(400).json({
        status: "error",
        message: error.details.map((d) => d.message).join(", "),
      });
    }

    // Cek apakah user punya vendor profile dulu
    const vendor = await vendorService.getMyVendor(req.user.id);

    const document = await vendorService.uploadDocument(vendor.id, value);
    res.status(201).json({
      status: "success",
      message: "Dokumen KYC berhasil diupload.",
      data: { document },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/vendors/me/documents
const getMyDocuments = async (req, res, next) => {
  try {
    const vendor = await vendorService.getMyVendor(req.user.id);
    const documents = await vendorService.getMyDocuments(vendor.id);
    res.status(200).json({ status: "success", data: { documents } });
  } catch (err) {
    next(err);
  }
};

// POST /api/vendors/me/products/:id/inventory
const manageInventory = async (req, res, next) => {
  try {
    const { error, value } = manageInventorySchema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ status: "error", message: error.details[0].message });

    const vendor = await vendorService.getMyVendor(req.user.id);
    const inventory = await vendorService.manageInventory(
      vendor.id,
      req.params.id,
      value,
    );

    res.status(200).json({ status: "success", data: { inventory } });
  } catch (err) {
    next(err);
  }
};

// POST /api/vendors/me/products/:id/cross-selling
const addCrossSellingRule = async (req, res, next) => {
  try {
    const { error, value } = crossSellingSchema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ status: "error", message: error.details[0].message });

    const vendor = await vendorService.getMyVendor(req.user.id);
    const rule = await vendorService.addCrossSellingRule(
      vendor.id,
      req.params.id,
      value.addon_id,
    );

    res.status(201).json({ status: "success", data: { rule } });
  } catch (err) {
    next(err);
  }
};

// GET /api/vendors/me/ledgers
const getMyLedger = async (req, res, next) => {
  try {
    const vendor = await vendorService.getMyVendor(req.user.id);
    const ledgers = await vendorService.getMyLedger(vendor.id);
    res.status(200).json({ status: "success", data: { ledgers } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createVendor,
  getMyVendor,
  updateVendor,
  getVendorById,
  uploadDocument,
  getMyDocuments,
  manageInventory,
  addCrossSellingRule,
  getMyLedger,
};
