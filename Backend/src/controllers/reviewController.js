"use strict";
const Joi = require("joi");
const reviewService = require("../services/reviewService");

const reviewSchema = Joi.object({
  product_id: Joi.string().required(),
  rating: Joi.number().min(1).max(5).required().messages({
    "number.min": "Rating minimal 1 bintang.",
    "number.max": "Rating maksimal 5 bintang.",
  }),
  komentar: Joi.string().max(500).allow(null, ""),
});

const createReview = async (req, res, next) => {
  try {
    const { error, value } = reviewSchema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ status: "error", message: error.details[0].message });

    const review = await reviewService.createReview(
      req.user.id,
      req.params.orderId,
      value,
    );

    res.status(201).json({
      status: "success",
      message: "Terima kasih atas ulasan Anda!",
      data: { review },
    });
  } catch (err) {
    next(err);
  }
};

const getProductReviews = async (req, res, next) => {
  try {
    const reviews = await reviewService.getProductReviews(req.params.productId);
    res.status(200).json({
      status: "success",
      data: { reviews },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createReview,
  getProductReviews,
};
