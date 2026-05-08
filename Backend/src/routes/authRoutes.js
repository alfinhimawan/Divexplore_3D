"use strict";
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticate, authorize } = require("../middlewares/authenticate");

// POST /api/auth/register
router.post("/register", authController.register);

// POST /api/auth/login
router.post("/login", authController.login);

// POST /api/auth/google
router.post("/google", authController.googleLogin);

// GET /api/auth/me — butuh token JWT
router.get("/me", authenticate, authController.getMe);

// PUT /api/auth/me — update profil
router.put("/me", authenticate, authController.updateProfile);

// Rute khusus wisatawan
router.get(
  "/me/points",
  authenticate,
  authorize("wisatawan"),
  authController.getMyPoints,
);

// Record User Consent (GDPR)
router.post("/consent", authenticate, authController.recordConsent);

// Delete Account (Soft Delete - GDPR Right to be Forgotten)
router.delete("/account", authenticate, authController.deleteAccount);

module.exports = router;
