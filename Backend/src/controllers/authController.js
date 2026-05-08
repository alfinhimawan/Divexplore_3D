"use strict";
const Joi = require("joi");
const authService = require("../services/authService");

// Schema Validasi Input
const registerSchema = Joi.object({
  nama_lengkap: Joi.string().min(2).max(100).required().messages({
    "string.min": "Nama lengkap minimal 2 karakter.",
    "any.required": "Nama lengkap wajib diisi.",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Format email tidak valid.",
    "any.required": "Email wajib diisi.",
  }),
  password: Joi.string().min(8).required().messages({
    "string.min": "Password minimal 8 karakter.",
    "any.required": "Password wajib diisi.",
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const googleSchema = Joi.object({
  id_token: Joi.string().required().messages({
    "any.required": "Token Google wajib dikirim.",
  }),
});

const consentSchema = Joi.object({
  policy_version: Joi.string().required(),
  is_agreed: Joi.boolean().required(),
});

const updateProfileSchema = Joi.object({
  nama_lengkap: Joi.string().min(2).max(100),
  nomor_telepon: Joi.string().allow(null, ""),
  alamat: Joi.string().allow(null, ""),
  foto_profil_url: Joi.string().uri().allow(null, ""),
});

// Register
const register = async (req, res, next) => {
  try {
    // 1. Validasi input
    const { error, value } = registerSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return res.status(400).json({
        status: "error",
        message: error.details.map((d) => d.message).join(", "),
      });
    }

    // 2. Proses ke service
    const { user, token } = await authService.register(value);

    // 3. Kirim response
    res.status(201).json({
      status: "success",
      message: "Registrasi berhasil.",
      data: { user, token },
    });
  } catch (err) {
    next(err);
  }
};

// Login
const login = async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return res.status(400).json({
        status: "error",
        message: error.details.map((d) => d.message).join(", "),
      });
    }

    const { user, token } = await authService.login(value);

    // Set HttpOnly Cookie untuk keamanan tambahan
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari
    });

    res.status(200).json({
      status: "success",
      message: "Login berhasil.",
      data: { user, token },
    });
  } catch (err) {
    next(err);
  }
};

// Google OAuth
const googleLogin = async (req, res, next) => {
  try {
    const { error, value } = googleSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return res.status(400).json({
        status: "error",
        message: error.details.map((d) => d.message).join(", "),
      });
    }

    const { user, token } = await authService.googleLogin(value);

    // Set HttpOnly Cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari
    });

    res.status(200).json({
      status: "success",
      message: "Login Google berhasil.",
      data: { user, token },
    });
  } catch (err) {
    next(err);
  }
};

// Get Profile
const getMe = async (req, res, next) => {
  try {
    // req.user sudah diisi oleh middleware authenticate
    const user = await authService.getMe(req.user.id);

    res.status(200).json({
      status: "success",
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

// Get Loyalty Points
const getMyPoints = async (req, res, next) => {
  try {
    const points = await authService.getMyPoints(req.user.id);
    res.status(200).json({
      status: "success",
      data: { points },
    });
  } catch (err) {
    next(err);
  }
};

// Record User Consent
const recordConsent = async (req, res, next) => {
  try {
    const { error, value } = consentSchema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ status: "error", message: error.details[0].message });

    const consent = await authService.recordConsent(req.user.id, value);

    res.status(201).json({
      status: "success",
      message: "Persetujuan kebijakan berhasil dicatat.",
      data: { consent },
    });
  } catch (err) {
    next(err);
  }
};

// Soft Delete Account
const deleteAccount = async (req, res, next) => {
  try {
    const result = await authService.deleteAccount(req.user.id);

    // Hapus cookie token setelah akun dihapus
    res.clearCookie("token");

    res.status(200).json({
      status: "success",
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
};

// Update Profile
const updateProfile = async (req, res, next) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ status: "error", message: error.details[0].message });

    const user = await authService.updateProfile(req.user.id, value);

    res.status(200).json({
      status: "success",
      message: "Profil berhasil diperbarui.",
      data: { user },
    });
  } catch (err) {
    next(err);
  }
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
