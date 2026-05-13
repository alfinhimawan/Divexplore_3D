"use strict";
const {
  Product,
  ProductInventory,
  Product3dHotspot,
  Vendor,
  CrossSellingRule,
  Review,
  User
} = require("../models");
const { Op } = require("sequelize");

// Buat produk baru
const createProduct = async (vendorId, data) => {
  const product = await Product.create({ vendor_id: vendorId, ...data });
  return product;
};

// Ambil semua produk aktif (Publik) dengan Search & Filter
const getAllProducts = async (query = {}) => {
  const { search, kategori } = query;

  const whereCondition = { is_active: true };

  if (search) {
    whereCondition.nama_produk = {
      [Op.iLike]: `%${search}%`, // Case-insensitive search, aman dari SQL Injection
    };
  }

  const products = await Product.findAll({
    where: whereCondition,
    include: [
      {
        model: Vendor,
        as: "vendor",
        attributes: ["id", "nama_toko", "kategori", "logo_url"],
        // Filter by kategori vendor jika ada query parameter-nya
        ...(kategori && {
          where: { kategori: { [Op.iLike]: `%${kategori}%` } },
        }),
      },
      {
        model: CrossSellingRule,
        as: "crossSellingAsMain",
        include: [
          {
            model: Product,
            as: "addonProduct",
            attributes: ["id", "nama_produk", "harga"],
          },
        ],
      },
      {
        model: Product3dHotspot,
        as: "hotspots",
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return products;
};

// Ambil detail 1 produk (Publik)
const getProductById = async (productId) => {
  const product = await Product.findByPk(productId, {
    include: [
      {
        model: Vendor,
        as: "vendor",
        attributes: [
          "id",
          "nama_toko",
          "kategori",
          "logo_url",
          "alamat_lengkap",
        ],
      },
      { model: ProductInventory, as: "inventories" },
      { model: Product3dHotspot, as: "hotspots" },
      {
        model: CrossSellingRule,
        as: "crossSellingAsMain",
        include: [
          {
            model: Product,
            as: "addonProduct",
            attributes: ["id", "nama_produk", "harga", "thumbnail_url"],
            include: [
              {
                model: Vendor,
                as: "vendor",
                attributes: ["id", "nama_toko"],
              },
            ],
          },
        ],
      },
      {
        model: Review,
        as: "reviews",
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "nama_lengkap", "profile_picture_url"]
          }
        ]
      }
    ],
  });

  if (!product) {
    const err = new Error("Produk tidak ditemukan.");
    err.statusCode = 404;
    throw err;
  }

  return product;
};

// Update produk (dengan validasi kepemilikan / Authorization)
const updateProduct = async (vendorId, productId, data) => {
  const product = await getProductById(productId);

  // Cek kepemilikan: Vendor hanya boleh update produk miliknya sendiri
  if (product.vendor_id !== vendorId) {
    const err = new Error("Akses ditolak. Anda bukan pemilik produk ini.");
    err.statusCode = 403;
    throw err;
  }

  await product.update(data);
  return product;
};

// Hapus produk dengan Soft Delete (mengisi deletedAt, baris tetap ada di DB)
const deleteProduct = async (vendorId, productId) => {
  const product = await getProductById(productId);

  // Cek kepemilikan
  if (product.vendor_id !== vendorId) {
    const err = new Error("Akses ditolak. Anda bukan pemilik produk ini.");
    err.statusCode = 403;
    throw err;
  }

  // Karena model diset paranoid: true, destroy() hanya mengisi kolom deletedAt
  await product.destroy();
};

// Menambahkan produk tambahan (Add-on) sebagai rekomendasi bundling
const addBundlingRule = async (vendorId, primaryProductId, addonProductId) => {
  // 1. Pastikan vendor memiliki produk utama
  const primaryProduct = await getProductById(primaryProductId);
  if (primaryProduct.vendor_id !== vendorId) {
    const err = new Error(
      "Akses ditolak. Anda hanya bisa mengatur bundling untuk produk Anda sendiri.",
    );
    err.statusCode = 403;
    throw err;
  }

  // 2. Pastikan produk tambahan yang ingin direkomendasikan itu eksis
  const addonProduct = await Product.findByPk(addonProductId);
  if (!addonProduct) {
    const err = new Error("Produk tambahan (addon) tidak ditemukan.");
    err.statusCode = 404;
    throw err;
  }

  // 3. Cegah bundling dengan diri sendiri
  if (primaryProductId === addonProductId) {
    const err = new Error(
      "Tidak dapat mem-bundling produk dengan dirinya sendiri.",
    );
    err.statusCode = 400;
    throw err;
  }

  // 4. Simpan ke database
  const rule = await CrossSellingRule.create({
    primary_product_id: primaryProductId,
    addon_product_id: addonProductId,
  });

  return rule;
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addBundlingRule,
};
