"use strict";
const paymentService = require("../services/paymentService");

// POST /api/webhooks/midtrans
const midtransNotification = async (req, res, next) => {
  try {
    const payload = req.body;

    // Proses webhook
    await paymentService.handleMidtransWebhook(payload);

    // PENTING: Selalu respon 200 OK ke server Midtrans
    res.status(200).json({ status: "success", message: "Webhook received" });
  } catch (err) {
    // Tetap respon 200 OK ke Midtrans agar mereka tidak menganggap URL mati, 
    // tapi kita catat errornya di log server.
    console.error("Webhook Processing Error:", err.message);
    res.status(200).json({ 
      status: "error_logged", 
      message: "Error handled, logged on server" 
    });
  }
};

module.exports = {
  midtransNotification,
};
