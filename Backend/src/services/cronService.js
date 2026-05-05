"use strict";
const cron = require("node-cron");
const marketingService = require("./marketingService");
const logger = require("../utils/logger");

/**
 * Inisialisasi semua Cron Job untuk Retargeting & Notification Strategy
 *
 * Jadwal:
 * - Setiap 30 menit : Case A — Pending Payment Reminder
 * - Setiap hari 09:00 WIB : Case B — Loyalty Offer
 * - Setiap hari 10:00 WIB : Case C — Retargeting Visit
 *
 * Panggil initCronJobs() SEKALI saat server startup di server.js
 */
const initCronJobs = () => {
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

  logger.info("[CRON] Semua cron job marketing berhasil diinisialisasi.");
};

module.exports = { initCronJobs };