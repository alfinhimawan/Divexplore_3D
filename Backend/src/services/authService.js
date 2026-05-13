"use strict";
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const { User, LoyaltyPoint, UserConsent, AuditLog } = require("../models");
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

  // PILAR 4 GDPR: Accountability (Audit Log)
  await AuditLog.create({
    user_id: user.id,
    tabel_terdampak: "Users",
    data_lama: "Login Activity",
    data_baru: "Success Login",
  });

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

  const { sub: google_id, email, name: nama_lengkap, email_verified, picture } = payload;

  // VERIFIKASI GMAIL: Pastikan email Google pengguna berstatus 'verified'
  if (!email_verified) {
    const err = new Error(
      "Alamat Gmail Anda belum diverifikasi oleh Google. Silakan verifikasi Gmail Anda terlebih dahulu.",
    );
    err.statusCode = 403; // Forbidden
    throw err;
  }

  // Cari user berdasarkan google_id atau email
  let user = await User.findOne({
    where: { [Op.or]: [{ google_id }, { email }] },
  });

  if (!user) {
    // Pertama kali login Google → buat akun baru otomatis sebagai wisatawan
    // Ambil foto profil asli dari Google (picture)
    user = await User.create({
      nama_lengkap,
      email,
      google_id,
      auth_provider: "google",
      role: "wisatawan",
      foto_profil_url: picture, // <--- Ambil dari Google
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

    // Update foto profil & google_id jika belum ada
    const updateData = {};
    if (!user.google_id) {
      updateData.google_id = google_id;
      updateData.auth_provider = "google";
    }
    // Jika foto masih kosong atau masih dummy, update dengan foto Google
    if (!user.foto_profil_url || user.foto_profil_url.includes('dummy') || user.foto_profil_url.includes('ui-avatars')) {
      updateData.foto_profil_url = picture;
    }

    if (Object.keys(updateData).length > 0) {
      await user.update(updateData);
    }
  }

  const token = signToken(user);
  return { user, token };
};

// Update Profile
const updateProfile = async (userId, data) => {
  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error("User tidak ditemukan.");
    err.statusCode = 404;
    throw err;
  }

  // Update field yang diizinkan
  await user.update({
    nama_lengkap: data.nama_lengkap || user.nama_lengkap,
    nomor_telepon: data.nomor_telepon || user.nomor_telepon,
    alamat: data.alamat || user.alamat,
    foto_profil_url: data.foto_profil_url || user.foto_profil_url,
  });

  return user;
};

// Get Current User
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

// Soft Delete Account (Right to be Forgotten)
const deleteAccount = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error("User tidak ditemukan.");
    err.statusCode = 404;
    throw err;
  }

  // Sequelize .destroy() otomatis jadi soft delete karena paranoid: true
  await user.destroy();
  return { message: "Akun berhasil dinonaktifkan (Soft Delete)." };
};

module.exports = {
  register,
  login,
  googleLogin,
  getMe,
  getMyPoints,
  recordConsent,
  deleteAccount,
  updateProfile,
};
