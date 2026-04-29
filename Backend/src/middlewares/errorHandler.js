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
