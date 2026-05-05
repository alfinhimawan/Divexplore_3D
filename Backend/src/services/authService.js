"use strict";
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const { User, LoyaltyPoint, UserConsent } = require("../models");
const { Op } = require("sequelize");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const SALT_ROUNDS = 12; // semakin tinggi, semakin aman tapi semakin lambat

// Helper: Generate JWT Token
const signToken = (user) => {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// Register (Khusus Vendor)
const register = async ({ nama_lengkap, email, password }) => {
  // Cek apakah email sudah dipakai
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    const err = new Error("Email sudah terdaftar.");
    err.statusCode = 409; // Conflict
    throw err;
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  // Buat user baru (HANYA UNTUK VENDOR)
  const user = await User.create({
    nama_lengkap,
    email,
    password_hash,
    auth_provider: "local",
    role: "vendor", // Di-hardcode karena wisatawan pakai Google
  });

  const token = signToken(user);
  return { user, token };
};

// Login
const login = async ({ email, password }) => {
  // Scope "withPassword" → ambil semua kolom termasuk password_hash
  const user = await User.scope("withPassword").findOne({ where: { email } });

  if (!user) {
    const err = new Error("Email atau password salah.");
    err.statusCode = 401;
    throw err;
  }

  // Cek apakah user ini login via Google (tidak punya password)
  if (user.auth_provider !== "local") {
    const err = new Error(
      "Akun ini terdaftar via Google. Gunakan Google Login.",
    );
    err.statusCode = 400;
    throw err;
  }

  // Verifikasi password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    const err = new Error("Email atau password salah.");
    err.statusCode = 401;
    throw err;
  }

  const token = signToken(user);

  // Hapus password_hash dari objek sebelum dikirim ke client
  const userSafe = user.toJSON();
  delete userSafe.password_hash;

  return { user: userSafe, token };
};

// Google OAuth
const googleLogin = async ({ id_token }) => {
  // Verifikasi token Google
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    const err = new Error("Token Google tidak valid.");
    err.statusCode = 401;
    throw err;
  }

  const { sub: google_id, email, name: nama_lengkap } = payload;

  // Cari user berdasarkan google_id atau email
  let user = await User.findOne({
    where: { [Op.or]: [{ google_id }, { email }] },
  });

  if (!user) {
    // Pertama kali login Google → buat akun baru otomatis sebagai wisatawan
    // Role "wisatawan" di-hardcode — Google OAuth HANYA untuk wisatawan (B2C)
    user = await User.create({
      nama_lengkap,
      email,
      google_id,
      auth_provider: "google",
      role: "wisatawan", // hardcoded, tidak bisa diubah dari luar
    });
  } else {
    // Akun dengan email ini sudah ada di database
    // Blokir jika role bukan wisatawan (vendor & admin wajib pakai login manual)
    if (user.role !== "wisatawan") {
      const err = new Error(
        "Akun vendor/admin tidak dapat menggunakan Google Login. Gunakan email dan password.",
      );
      err.statusCode = 403;
      throw err;
    }

    // Wisatawan yang belum terhubung Google → hubungkan sekarang
    if (!user.google_id) {
      await user.update({ google_id, auth_provider: "google" });
    }
  }

  const token = signToken(user);
  return { user, token };
};

// Get Profile
const getMe = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error("User tidak ditemukan.");
    err.statusCode = 404;
    throw err;
  }
  return user;
};

// Get Loyalty Points
const getMyPoints = async (userId) => {
  const points = await LoyaltyPoint.findAll({
    where: { user_id: userId },
    order: [["createdAt", "DESC"]],
  });
  return points;
};

// Record User Consent (GDPR Compliance)
const recordConsent = async (userId, { policy_version, is_agreed }) => {
  const consent = await UserConsent.create({
    user_id: userId,
    policy_version,
    is_agreed,
    agreed_at: is_agreed ? new Date() : null,
  });
  return consent;
};

module.exports = {
  register,
  login,
  googleLogin,
  getMe,
  getMyPoints,
  recordConsent,
};
