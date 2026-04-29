"use strict";
const Joi = require("joi");
const { Order, OrderItem, Review } = require("../models");

// POST /api/orders/:orderId/reviews
// Catatan: Review diletakkan di level Order, tapi mengaitkan dengan Vendor.
const createReview = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.user.id;

    // Validasi payload
    const schema = Joi.object({
      rating: Joi.number().integer().min(1).max(5).required(),
      komentar: Joi.string().max(500).optional().allow(""),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ status: "error", message: error.details[0].message });
    }

    // WP-3.3.4: Validasi bahwa user ini benar-benar pemilik order & order berstatus "paid"
    const order = await Order.findOne({
      where: { id: orderId, user_id: userId },
      include: ["items"],
    });

    if (!order) {
      return res
        .status(404)
        .json({ status: "error", message: "Order tidak ditemukan." });
    }

    if (order.status !== "paid") {
      return res
        .status(403)
        .json({
          status: "error",
          message: "Hanya pesanan yang lunas yang bisa di-review.",
        });
    }

    // Cek apakah sudah pernah review
    const existingReview = await Review.findOne({
      where: { order_id: orderId, user_id: userId },
    });
    if (existingReview) {
      return res
        .status(409)
        .json({
          status: "error",
          message: "Anda sudah memberikan ulasan untuk pesanan ini.",
        });
    }

    // Ambil vendor pertama dari items pesanan ini
    const firstItem = order.items[0];
    const vendorId = firstItem.vendor_id;

    const newReview = await Review.create({
      user_id: userId,
      vendor_id: vendorId,
      order_id: orderId,
      rating: value.rating,
      komentar: value.komentar,
    });

    res.status(201).json({
      status: "success",
      message: "Terima kasih atas ulasan Anda.",
      data: { review: newReview },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createReview,
};
