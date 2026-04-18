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
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        status: "error",
        message: "Token tidak valid atau sudah expired.",
      });
    }

    // 3. Token valid → simpan data user ke req.user agar bisa dipakai controller
    req.user = decoded; // { id, role, iat, exp }
    next();
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
