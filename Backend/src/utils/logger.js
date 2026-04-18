"use strict";
const { createLogger, format, transports } = require("winston");
const path = require("path");

const logger = createLogger({
  level: process.env.NODE_ENV === "production" ? "warn" : "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    // Terminal - hanya saat development
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : "";
          return `[${timestamp}] ${level}: ${message} ${metaStr}`;
        })
      ),
    }),
    // File - error saja (semua environment)
    new transports.File({
      filename: path.join(__dirname, "../../logs", "error.log"),
      level: "error",
    }),
    // File - semua log (semua environment)
    new transports.File({
      filename: path.join(__dirname, "../../logs", "combined.log"),
    }),
  ],
});

module.exports = logger;
