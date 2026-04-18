require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const { rateLimit } = require("express-rate-limit");
const db = require("./src/models");
const logger = require("./src/utils/logger");

// Validasi Environment Variables Wajib
// Fail fast: lebih baik crash sekarang daripada error misterius saat runtime
if (!process.env.JWT_SECRET) {
  logger.error("FATAL: JWT_SECRET tidak ditemukan di .env");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Daftar origin yang diizinkan mengakses API
const ALLOWED_ORIGINS = [
  "http://localhost:3000", // React/Next.js dev
  "http://localhost:5173", // Vite dev
  "http://localhost:5000", // Self (testing)
];

// Security & Performance Middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Izinkan request tanpa origin (Postman, server-to-server)
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin '${origin}' tidak diizinkan`));
      }
    },
    credentials: true, // Izinkan cookie/Authorization header
  })
);
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request Logger (Morgan → Winston)
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  }),
);

// Rate Limiter
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,  // Kirim header RateLimit-* standar RFC
    legacyHeaders: false,   // Nonaktifkan header X-RateLimit-* lama
    message: {
      status: "error",
      message: "Terlalu banyak request, coba lagi dalam 15 menit.",
    },
  }),
);

// Health Check
app.get("/", (req, res) =>
  res
    .status(200)
    .json({ status: "success", message: "DIVEXPLORE-3D API running" }),
);

// Routes (akan ditambahkan di sini nanti)
// app.use("/api/auth", require("./src/routes/authRoutes"));

// 404 — Route tidak ditemukan
app.use((req, res, next) => {
  const err = new Error(`Route ${req.originalUrl} tidak ditemukan`);
  err.statusCode = 404;
  next(err); // lempar ke errorHandler
});

// Global Error Handler (harus paling bawah)
app.use(require("./src/middlewares/errorHandler"));

// Start Server
db.sequelize
  .authenticate()
  .then(() => {
    logger.info(`Database connected successfully`);
    app.listen(PORT, () =>
      logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV}]`),
    );
  })
  .catch((err) => {
    logger.error("Database connection failed", { error: err.message });
    process.exit(1);
  });
