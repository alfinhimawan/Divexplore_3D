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
 * Trigger Strategi Retargeting & Notifikasi (Flowchart Digital Marketing)
 * Fungsi ini idealnya dijalankan via Cron Job (tapi untuk demo bisa manual).
 */
const triggerMarketingStrategy = async () => {
  const reports = { reminder_payment: 0, loyalty_offer: 0, retargeting_visit: 0 };

  // 1. Case A: Reminder Pembayaran (Tunggu 1-2 Jam)
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
      await emailService.sendMarketingEmail(order.user.email, "REMINDER_PAYMENT", { order });
      reports.reminder_payment++;
    }
  }

  // 2. Case B: Penawaran Loyalitas (History Pembelian)
  // Mencari user yang pernah beli tapi tidak punya booking aktif
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
    // Hanya kirim jika tidak ada order pending saat ini
    const activeOrder = await Order.findOne({ where: { user_id: user.id, status: "pending" } });
    if (!activeOrder && user.email) {
      await emailService.sendMarketingEmail(user.email, "LOYALTY_OFFER", { user });
      reports.loyalty_offer++;
    }
  }

  // 3. Case C: Retargeting View Product (Tunggu 24 Jam)
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
    // Cek apakah user ini akhirnya beli produk tersebut atau tidak
    const hasBought = await Order.findOne({
      where: { user_id: visit.user_id, status: "paid" },
      include: [{ model: OrderItem, as: "items", where: { product_id: visit.product_id } }],
    });

    if (!hasBought && visit.user && visit.user.email) {
      await emailService.sendMarketingEmail(visit.user.email, "RETARGETING_VISIT", { 
        user: visit.user, 
        product: visit.product 
      });
      reports.retargeting_visit++;
    }
  }

  return reports;
};

module.exports = {
  logProductVisit,
  triggerMarketingStrategy,
};
