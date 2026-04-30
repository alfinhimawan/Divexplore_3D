"use strict";
const express = require("express");
const router = express.Router();
const sceneController = require("../controllers/sceneController");
const { authenticate, authorize } = require("../middlewares/authenticate");

// Public (Semua user dan pengunjung bisa melihat Scene 3D)
router.get("/", sceneController.getAllScenes);

// Admin Only (Hanya tim teknis Divexplore yang bisa buat scene dan memetakan hotspot)
router.post("/", authenticate, authorize("admin"), sceneController.createScene);
router.post(
  "/:id/hotspots",
  authenticate,
  authorize("admin"),
  sceneController.addHotspot,
);

module.exports = router;
