"use strict";
const { Review, Order, OrderItem, Product, sequelize } = require("../models");

/**
 * Memberikan review untuk produk dalam sebuah pesanan
 * Syarat: Status order harus 'paid' atau 'completed'
 */
const createReview = async (userId, orderId, data) => {
  const transaction = await sequelize.transaction();
  try {
    // 1. Validasi Order
    const order = await Order.findOne({
      where: { id: orderId, user_id: userId },
      include: ["items"],
      transaction,
    });

    if (!order) throw new Error("Pesanan tidak ditemukan.");
    if (order.status !== "paid" && order.status !== "completed") {
      throw new Error("Review hanya bisa diberikan untuk pesanan yang sudah dibayar.");
    }

    // 2. Cek apakah produk yang di-review ada dalam pesanan tersebut
    const item = order.items.find((i) => i.product_id === data.product_id);
    if (!item) throw new Error("Produk ini tidak ada dalam riwayat pesanan Anda.");

    // 3. Cek apakah sudah pernah review produk ini untuk order ini
    const existing = await Review.findOne({
      where: { order_id: orderId, product_id: data.product_id },
      transaction,
    });
    if (existing) throw new Error("Anda sudah memberikan review untuk produk ini.");

    // 4. Simpan Review
    const review = await Review.create({
      user_id: userId,
      order_id: orderId,
      product_id: data.product_id,
      rating: data.rating,
      komentar: data.komentar,
    }, { transaction });

    // 5. Update Rating Produk secara denormalisasi (Opsional tapi bagus untuk performa)
    // Di sini kita biarkan dinamis saja saat ditarik di Product API.

    await transaction.commit();
    return review;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getProductReviews = async (productId) => {
  return await Review.findAll({
    where: { product_id: productId },
    include: ["user"],
    order: [["createdAt", "DESC"]],
  });
};

module.exports = {
  createReview,
  getProductReviews,
};
