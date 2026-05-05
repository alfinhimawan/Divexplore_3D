"use strict";
const { Scene, Product3dHotspot, Product } = require("../models");

// Mendapatkan semua scene beserta hotspotnya
const getAllScenes = async () => {
  const scenes = await Scene.findAll({
    include: [
      {
        model: Product3dHotspot,
        as: "hotspots",
        include: [
          {
            model: Product,
            as: "product",
            attributes: ["id", "nama_produk", "harga", "kategori"],
          },
        ],
      },
    ],
  });
  return scenes;
};

// Membuat scene baru (Admin Only)
const createScene = async (data) => {
  const scene = await Scene.create(data);
  return scene;
};

const updateScene = async (id, data) => {
  const scene = await Scene.findByPk(id);
  if (!scene) {
    const err = new Error("Scene tidak ditemukan.");
    err.statusCode = 404;
    throw err;
  }
  await scene.update(data);
  return scene;
};

// Menambahkan hotspot produk ke dalam scene (Admin Only)
const addHotspot = async (sceneId, data) => {
  // Verifikasi scene ada
  const scene = await Scene.findByPk(sceneId);
  if (!scene) {
    const err = new Error("Scene tidak ditemukan.");
    err.statusCode = 404;
    throw err;
  }

  // Verifikasi produk ada
  const product = await Product.findByPk(data.product_id);
  if (!product) {
    const err = new Error("Produk tidak ditemukan.");
    err.statusCode = 404;
    throw err;
  }

  const hotspot = await Product3dHotspot.create({
    scene_id: sceneId,
    product_id: data.product_id,
    coordinates_json: data.coordinates_json,
    description: data.description,
  });

  return hotspot;
};

const deleteScene = async (id) => {
  const scene = await Scene.findByPk(id);
  if (!scene) {
    const err = new Error("Scene tidak ditemukan.");
    err.statusCode = 404;
    throw err;
  }
  await scene.destroy();
  return { message: "Scene berhasil dihapus." };
};

module.exports = {
  getAllScenes,
  createScene,
  updateScene,
  deleteScene,
  addHotspot,
};
