"use strict";
const paymentService = require("../services/paymentService");

// POST /api/webhooks/midtrans
const midtransNotification = async (req, res, next) => {
  try {
    const payload = req.body;

    // Proses webhook
    await paymentService.handleMidtransWebhook(payload);

    // PENTING: Selalu respon 200 OK ke server Midtrans
    // agar Midtrans tidak mengulang-ulang pengiriman notifikasi
    res.status(200).json({ status: "success", message: "OK" });
  } catch (err) {
    // Tetap respon 200 OK ke Midtrans tapi catat error di log server kita
    // (Pengecualian: Jika Anda ingin Midtrans mencoba lagi nanti, bisa balas 500)
    console.error("Webhook Error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
};

module.exports = {
  midtransNotification,
};
