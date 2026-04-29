"use strict";
const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

// Route ini BERSIFAT PUBLIK (Tidak pakai JWT) karena dipanggil oleh Server Midtrans, bukan browser/aplikasi.
// Keamanannya dijamin melalui Signature Key validasi di sisi Service (Production).
router.post("/midtrans", paymentController.midtransNotification);

module.exports = router;
