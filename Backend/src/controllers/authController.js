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

module.exports = { register, login, googleLogin, getMe, getMyPoints };
