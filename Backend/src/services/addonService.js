"use strict";
const { ProductAddon, Product } = require("../models");
const vendorService = require("./vendorService");

/**
 * Ambil semua add-on milik sebuah produk (Publik)
 */
const getAddonsByProduct = async (productId) => {
  return await ProductAddon.findAll({
    where: { product_id: productId },
    order: [["harga", "ASC"]],
  });
};

/**
 * Buat add-on baru untuk produk milik vendor
 */
const createAddon = async (userId, productId, data) => {
  const vendor = await vendorService.getMyVendor(userId);
  const product = await Product.findOne({
    where: { id: productId, vendor_id: vendor.id },
  });
  if (!product) {
    const err = new Error("Produk tidak ditemukan atau bukan milik Anda.");
    err.statusCode = 404;
    throw err;
  }
  return await ProductAddon.create({ product_id: product.id, ...data });
};

/**
 * Update add-on (hanya vendor pemilik produk)
 */
const updateAddon = async (userId, productId, addonId, data) => {
  const vendor = await vendorService.getMyVendor(userId);
  const addon = await ProductAddon.findOne({
    where: { id: addonId, product_id: productId },
    include: [
      { model: Product, as: "product", where: { vendor_id: vendor.id } },
    ],
  });
  if (!addon) {
    const err = new Error("Add-on tidak ditemukan.");
    err.statusCode = 404;
    throw err;
  }
  return await addon.update(data);
};

/**
 * Hapus add-on (hanya vendor pemilik produk)
 */
const deleteAddon = async (userId, productId, addonId) => {
  const vendor = await vendorService.getMyVendor(userId);
  const addon = await ProductAddon.findOne({
    where: { id: addonId, product_id: productId },
    include: [
      { model: Product, as: "product", where: { vendor_id: vendor.id } },
    ],
  });
  if (!addon) {
    const err = new Error("Add-on tidak ditemukan.");
    err.statusCode = 404;
    throw err;
  }
  await addon.destroy();
};

module.exports = { getAddonsByProduct, createAddon, updateAddon, deleteAddon };
