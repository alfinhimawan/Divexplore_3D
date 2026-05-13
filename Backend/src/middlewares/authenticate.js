"use strict";
const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  // 1. Ambil token dari header Authorization: Bearer <token>
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // ambil bagian setelah "Bearer "

  if (!token) {
    return res.status(401).json({
      status: "error",
      message: "Akses ditolak. Token tidak ditemukan.",
    });
  }

  // 2. Verifikasi token
  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(401).json({
        status: "error",
        message: "Token tidak valid atau sudah expired.",
      });
    }

    try {
      // 3. CEK KE DATABASE: Apakah user ini masih ada? (Penting jika DB di-reset)
      const { User } = require("../models");
      const userRecord = await User.findByPk(decoded.id, {
        attributes: ["id", "role", "is_active"] // Cukup ambil field minimal
      });

      if (!userRecord || !userRecord.is_active) {
        return res.status(401).json({
          status: "error",
          message: "Sesi Anda telah berakhir. Silakan login kembali.",
        });
      }

      // 4. Token & User valid → simpan data user ke req.user
      req.user = decoded; 
      next();
    } catch (dbErr) {
      return res.status(500).json({
        status: "error",
        message: "Terjadi kesalahan sistem saat verifikasi akun.",
      });
    }
  });
};

// Middleware khusus untuk cek role tertentu
// Contoh pakai: authorize("admin") atau authorize("vendor", "admin")
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "error",
        message: `Akses ditolak. Hanya ${roles.join("/")} yang diizinkan.`,
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
