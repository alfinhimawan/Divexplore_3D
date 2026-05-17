"use strict";
const cron = require("node-cron");
const { Op } = require("sequelize");
const marketingService = require("./marketingService");
const logger = require("../utils/logger");

/**
 * Inisialisasi semua Cron Job untuk Retargeting & Notification Strategy
 *
 * Jadwal:
 * - Setiap 5 menit  : CRON #0 — Order Expiration (Inventory Release)
 * - Setiap 30 menit : Case A — Pending Payment Reminder
 * - Setiap hari 09:00 WIB : Case B — Loyalty Offer
 * - Setiap hari 10:00 WIB : Case C — Retargeting Visit
 *
 * Panggil initCronJobs() SEKALI saat server startup di server.js
 */
const initCronJobs = () => {
  // CRON #0 — Order Expiration & Inventory Release (CRITICAL)
  // Setiap 5 menit, cari order yang timeout_at sudah lewat dan masih pending
  cron.schedule("*/5 * * * *", async () => {
    logger.info("[CRON] #0 — Order Expiration Check...");
    try {
      const {
        Order,
        OrderItem,
        ProductInventory,
        sequelize,
      } = require("../models");
      const expiredOrders = await Order.findAll({
        where: {
          status: "pending",
          timeout_at: { [Op.lt]: new Date() },
        },
        include: [{ model: OrderItem, as: "items" }],
      });

      if (expiredOrders.length === 0) {
        return logger.info("[CRON] #0 — Tidak ada order expired.");
      }

      for (const order of expiredOrders) {
        await sequelize.transaction(async (t) => {
          // Kunci order DI DALAM transaksi untuk memastikan statusnya masih pending
          const lockedOrder = await Order.findOne({
            where: { id: order.id },
            transaction: t,
            lock: t.LOCK.UPDATE,
          });

          if (!lockedOrder || lockedOrder.status !== "pending") {
            // Jika sudah diurus oleh webhook atau manual cancel, lewati
            return;
          }

          // Release semua stok yang terkunci untuk order ini
          for (const item of order.items) {
            const inventory = await ProductInventory.findOne({
              where: { product_id: item.product_id },
              transaction: t,
              lock: t.LOCK.UPDATE,
            });
            if (inventory) {
              inventory.locked_qty = Math.max(
                0,
                inventory.locked_qty - item.qty,
              );
              inventory.available_qty += item.qty;
              await inventory.save({ transaction: t });
            }
          }
          // Ubah status order menjadi cancelled
          await lockedOrder.update({ status: "cancelled" }, { transaction: t });
        });
      }
      logger.info(
        `[CRON] #0 — ${expiredOrders.length} order expired dibatalkan & stok dilepas.`,
      );
    } catch (err) {
      logger.error("[CRON] #0 — Gagal:", err);
    }
  });

  // CRON #1 — Case A: Reminder Pembayaran Pending
  // Setiap 30 menit, deteksi order pending > 1 jam
  cron.schedule("*/30 * * * *", async () => {
    logger.info("[CRON] Case A — Reminder Pembayaran Pending...");
    try {
      const count = await marketingService.runCaseA();
      logger.info(`[CRON] Case A — Selesai. ${count} email terkirim.`);
    } catch (err) {
      logger.error("[CRON] Case A — Gagal:", err);
    }
  });

  // CRON #2 — Case B: Penawaran Loyalitas
  // Setiap hari jam 09:00 WIB (UTC+7 → UTC 02:00)
  cron.schedule("0 2 * * *", async () => {
    logger.info("[CRON] Case B — Penawaran Loyalitas...");
    try {
      const count = await marketingService.runCaseB();
      logger.info(`[CRON] Case B — Selesai. ${count} email terkirim.`);
    } catch (err) {
      logger.error("[CRON] Case B — Gagal:", err);
    }
  });

  // CRON #3 — Case C: Retargeting Kunjungan Produk
  // Setiap hari jam 10:00 WIB (UTC+7 → UTC 03:00)
  cron.schedule("0 3 * * *", async () => {
    logger.info("[CRON] Case C — Retargeting Kunjungan Produk...");
    try {
      const count = await marketingService.runCaseC();
      logger.info(`[CRON] Case C — Selesai. ${count} email terkirim.`);
    } catch (err) {
      logger.error("[CRON] Case C — Gagal:", err);
    }
  });

  logger.info(
    "[CRON] Semua cron job (expiration + marketing) berhasil diinisialisasi.",
  );
};

module.exports = { initCronJobs };
