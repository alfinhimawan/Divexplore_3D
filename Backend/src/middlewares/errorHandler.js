"use strict";
const logger = require("../utils/logger");

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Log detail error (message, stack, URL, method) ke Winston
  logger.error(err.message, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  // Handle Multer File Size Error
  if (err.name === "MulterError" && err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      status: "error",
      message: "Ukuran file terlalu besar. Silakan periksa batas maksimal ukuran file yang diizinkan.",
    });
  }

  // Handle Cloudinary Format Error
  if (err.message && err.message.includes("allowed_formats")) {
    return res.status(400).json({
      status: "error",
      message: "Format file tidak didukung. Silakan gunakan format file yang diizinkan (misal: jpg/png/pdf/glb).",
    });
  }

  // Tentukan status code
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    status: "error",
    message: err.message || "Internal Server Error",
    // Stack trace hanya tampil di development (bukan production)
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
