"use strict";
const jwt = require("jsonwebtoken");
const { User } = require("../models"); // Kunci: Harus di atas
const logger = require("../utils/logger");

const authenticate = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; 

  if (!token) {
    return res.status(401).json({
      status: "error",
      message: "Akses ditolak. Token tidak ditemukan.",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(401).json({
        status: "error",
        message: "Token tidak valid atau sudah expired.",
      });
    }

    try {
      // Cek database apakah user masih ada (Penting jika DB di-reset)
      const userRecord = await User.findByPk(decoded.id, {
        attributes: ["id", "role"] // Hapus is_active karena tidak ada di DB
      });

      if (!userRecord) {
        return res.status(401).json({
          status: "error",
          message: "Sesi Anda telah berakhir. Silakan login kembali.",
        });
      }

      req.user = decoded; 
      next();
    } catch (dbErr) {
      logger.error(`[AuthMiddleware] Error: ${dbErr.message}`, { stack: dbErr.stack });
      return res.status(500).json({
        status: "error",
        message: "Terjadi kesalahan internal pada server (Auth).",
      });
    }
  });
};

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
