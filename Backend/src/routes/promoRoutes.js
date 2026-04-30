"use strict";
const express = require("express");
const router = express.Router();
const promoController = require("../controllers/promoController");
const { authenticate, authorize } = require("../middlewares/authenticate");

// Public
router.get("/", promoController.getAllPromos);

// Admin Only
router.post("/", authenticate, authorize("admin"), promoController.createPromo);

module.exports = router;
