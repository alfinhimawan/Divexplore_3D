"use strict";
const Joi = require("joi");
const sceneService = require("../services/sceneService");

const createSceneSchema = Joi.object({
  nama_scene: Joi.string().required(),
  panorama_url: Joi.string().uri().required(),
  is_active: Joi.boolean().default(true),
});

const addHotspotSchema = Joi.object({
  product_id: Joi.string().uuid().required(),
  coordinates_json: Joi.string().required(), // misal: '{"x":10, "y":20, "z":30}'
  description: Joi.string().allow("", null),
});

const getAllScenes = async (req, res, next) => {
  try {
    const scenes = await sceneService.getAllScenes();
    res.status(200).json({
      status: "success",
      data: { scenes },
    });
  } catch (err) {
    next(err);
  }
};

const createScene = async (req, res, next) => {
  try {
    const { error, value } = createSceneSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: "error",
        message: error.details.map((d) => d.message).join(", "),
      });
    }

    const scene = await sceneService.createScene(value);
    res.status(201).json({
      status: "success",
      message: "Scene berhasil dibuat.",
      data: { scene },
    });
  } catch (err) {
    next(err);
  }
};

const addHotspot = async (req, res, next) => {
  try {
    const { id: sceneId } = req.params;
    const { error, value } = addHotspotSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: "error",
        message: error.details.map((d) => d.message).join(", "),
      });
    }

    const hotspot = await sceneService.addHotspot(sceneId, value);
    res.status(201).json({
      status: "success",
      message: "Hotspot berhasil ditambahkan ke scene.",
      data: { hotspot },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllScenes,
  createScene,
  addHotspot,
};
