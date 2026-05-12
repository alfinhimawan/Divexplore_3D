"use strict";
const { createLogger, format, transports } = require("winston");
const path = require("path");

const isProduction = process.env.NODE_ENV === "production";

const logger = createLogger({
  level: "info", // selalu tangkap dari info ke atas
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    // Terminal - lebih ringkas di production
    new transports.Console({
      level: isProduction ? "warn" : "info",
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : "";
          return `[${timestamp}] ${level}: ${message} ${metaStr}`;
        })
      ),
    }),
    // File - error saja
    new transports.File({
      filename: path.join(__dirname, "../../logs", "error.log"),
      level: "error",
    }),
    // File - semua log termasuk info (webhook, email, dll)
    new transports.File({
      filename: path.join(__dirname, "../../logs", "combined.log"),
      level: "info",
    }),
  ],
});


module.exports = logger;
