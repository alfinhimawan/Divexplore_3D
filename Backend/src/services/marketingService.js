"use strict";
const { ProductVisit, Order, User, OrderItem, Product } = require("../models");
const { Op } = require("sequelize");
const emailService = require("./emailService");
const logger = require("../utils/logger");

/**
 * Mencatat kunjungan user ke sebuah produk
 */
const logProductVisit = async (userId, productId) => {
  try {
    if (!userId) return;

    const [visit, created] = await ProductVisit.findOrCreate({
      where: { user_id: userId, product_id: productId },
      defaults: { last_visited_at: new Date(), visit_count: 1 },
    });

    if (!created) {
      await visit.update({
        last_visited_at: new Date(),
        visit_count: visit.visit_count + 1,
      });
    }
  } catch (error) {
    logger.error("Gagal mencatat kunjungan produk:", error);
  }
};

/**
 * Case A: Reminder Pembayaran (Tunggu 1-2 Jam)
 */
const runCaseA = async () => {
  let count = 0;
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const pendingOrders = await Order.findAll({
    where: {
      status: "pending",
      createdAt: { [Op.lt]: oneHourAgo },
    },
    include: [{ model: User, as: "user" }],
  });

  for (const order of pendingOrders) {
    if (order.user && order.user.email) {
      await emailService.sendMarketingEmail(
        order.user.email,
        "REMINDER_PAYMENT",
        { order },
      );
      count++;
    }
  }
  return count;
};

/**
 * Case B: Penawaran Loyalitas (History Pembelian)
 */
const runCaseB = async () => {
  let count = 0;
  const loyalUsers = await User.findAll({
    where: { role: "wisatawan" },
    include: [
      {
        model: Order,
        as: "orders",
        where: { status: "paid" },
        required: true,
      },
    ],
  });

  for (const user of loyalUsers) {
    const activeOrder = await Order.findOne({
      where: { user_id: user.id, status: "pending" },
    });
    if (!activeOrder && user.email) {
      await emailService.sendMarketingEmail(user.email, "LOYALTY_OFFER", {
        user,
      });
      count++;
    }
  }
  return count;
};

/**
 * Case C: Retargeting View Product (Tunggu 24 Jam)
 */
const runCaseC = async () => {
  let count = 0;
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const abandonedVisits = await ProductVisit.findAll({
    where: {
      last_visited_at: { [Op.lt]: twentyFourHoursAgo },
    },
    include: [
      { model: User, as: "user" },
      { model: Product, as: "product" },
    ],
  });

  for (const visit of abandonedVisits) {
    const hasBought = await Order.findOne({
      where: { user_id: visit.user_id, status: "paid" },
      include: [
        {
          model: OrderItem,
          as: "items",
          where: { product_id: visit.product_id },
        },
      ],
    });

    if (!hasBought && visit.user && visit.user.email) {
      await emailService.sendMarketingEmail(
        visit.user.email,
        "RETARGETING_VISIT",
        {
          user: visit.user,
          product: visit.product,
        },
      );
      count++;
    }
  }
  return count;
};

/**
 * Trigger Strategi Retargeting & Notifikasi (Manual Trigger)
 */
const triggerMarketingStrategy = async () => {
  const reports = {
    reminder_payment: await runCaseA(),
    loyalty_offer: await runCaseB(),
    retargeting_visit: await runCaseC(),
  };
  return reports;
};

module.exports = {
  logProductVisit,
  runCaseA,
  runCaseB,
  runCaseC,
  triggerMarketingStrategy,
};
