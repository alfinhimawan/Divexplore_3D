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

    // 5. Kalkulasi Rata-Rata Rating Vendor (sesuai Alur BA)
    // Ambil vendor_id dari product yang baru di-review
    const { Vendor, Product } = require("../models");
    const product = await Product.findByPk(data.product_id, {
      attributes: ["vendor_id"],
      transaction,
    });

    if (product?.vendor_id) {
      const avgResult = await Review.findOne({
        attributes: [[sequelize.fn("AVG", sequelize.col("rating")), "avg_rating"]],
        where: { vendor_id: product.vendor_id },
        raw: true,
        transaction,
      });

      const avgRating = avgResult?.avg_rating
        ? parseFloat(parseFloat(avgResult.avg_rating).toFixed(2))
        : null;

      await Vendor.update(
        { rating: avgRating },
        { where: { id: product.vendor_id }, transaction }
      );
    }

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
