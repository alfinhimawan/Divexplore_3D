"use strict";
const Joi = require("joi");
const productService = require("../services/productService");
const vendorService = require("../services/vendorService");
const marketingService = require("../services/marketingService");

// Schema validasi — digunakan untuk POST (create)
const createProductSchema = Joi.object({
  nama_produk: Joi.string().min(3).max(150).required().messages({
    "string.min": "Nama produk minimal 3 karakter.",
    "any.required": "Nama produk wajib diisi.",
  }),
  harga: Joi.number().positive().required().messages({
    "number.positive": "Harga harus bernilai positif.",
    "any.required": "Harga wajib diisi.",
  }),
  thumbnail_url: Joi.string().uri().optional().allow(null, "").messages({
    "string.uri": "Thumbnail URL harus berupa URL yang valid.",
  }),
  is_active: Joi.boolean().optional(),
});

// Schema validasi — digunakan untuk PUT (update), semua field opsional minimal 1
const updateProductSchema = Joi.object({
  nama_produk: Joi.string().min(3).max(150),
  harga: Joi.number().positive(),
  thumbnail_url: Joi.string().uri().optional().allow(null, ""),
  is_active: Joi.boolean(),
}).min(1); // Minimal 1 field wajib dikirim

// POST /api/products
const createProduct = async (req, res, next) => {
  try {
    const { error, value } = createProductSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return res.status(400).json({
        status: "error",
        message: error.details.map((d) => d.message).join(", "),
      });
    }

    // Ambil vendor_id dari user yang sedang login
    const vendor = await vendorService.getMyVendor(req.user.id);

    const product = await productService.createProduct(vendor.id, value);

    res.status(201).json({
      status: "success",
      message: "Produk berhasil dibuat.",
      data: { product },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/products
const getAllProducts = async (req, res, next) => {
  try {
    const products = await productService.getAllProducts(req.query);
    res.status(200).json({
      status: "success",
      data: { products, total: products.length },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/products/:id
const getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);

    // Logging Kunjungan (WP-7.1.3)
    if (req.user) {
      marketingService.logProductVisit(req.user.id, req.params.id);
    }

    res.status(200).json({ status: "success", data: { product } });
  } catch (err) {
    next(err);
  }
};

// PUT /api/products/:id
const updateProduct = async (req, res, next) => {
  try {
    const { error, value } = updateProductSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return res.status(400).json({
        status: "error",
        message: error.details.map((d) => d.message).join(", "),
      });
    }

    const vendor = await vendorService.getMyVendor(req.user.id);
    const product = await productService.updateProduct(
      vendor.id,
      req.params.id,
      value,
    );

    res.status(200).json({
      status: "success",
      message: "Produk berhasil diperbarui.",
      data: { product },
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/products/:id
const deleteProduct = async (req, res, next) => {
  try {
    const vendor = await vendorService.getMyVendor(req.user.id);
    await productService.deleteProduct(vendor.id, req.params.id);

    res.status(204).send(); // 204 No Content — standar RESTful untuk DELETE berhasil
  } catch (err) {
    next(err);
  }
};

// POST /api/products/:id/bundling
const addBundling = async (req, res, next) => {
  try {
    const primaryProductId = req.params.id;
    // Validasi sederhana menggunakan Joi inline
    const schema = Joi.object({
      addon_product_id: Joi.string().uuid().required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ status: "error", message: error.details[0].message });
    }

    const vendor = await vendorService.getMyVendor(req.user.id);
    const rule = await productService.addBundlingRule(
      vendor.id,
      primaryProductId,
      value.addon_product_id,
    );

    res.status(201).json({
      status: "success",
      message: "Rekomendasi bundling berhasil ditambahkan.",
      data: { rule },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addBundling,
};
