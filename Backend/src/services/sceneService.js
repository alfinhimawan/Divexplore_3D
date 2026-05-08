"use strict";
const { Scene, Product3dHotspot, Product } = require("../models");

// Mendapatkan semua scene beserta hotspotnya (Data Kaya untuk FE)
const getAllScenes = async () => {
  const { Vendor, Scene: SceneModel } = require("../models");
  const scenes = await Scene.findAll({
    include: [
      {
        model: Product3dHotspot,
        as: "hotspots",
        include: [
          {
            model: Product,
            as: "product",
            attributes: [
              "id",
              "nama_produk",
              "harga",
              "kategori",
              "thumbnail_url",
            ],
            include: [
              {
                model: Vendor,
                as: "vendor",
                attributes: ["nama_toko"], // Ambil nama toko vendor untuk popup
              },
            ],
          },
          {
            model: SceneModel,
            as: "targetScene",
            attributes: ["id", "nama_scene"], // Info scene tujuan untuk navigasi
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

// Menambahkan hotspot (Produk atau Navigasi) ke dalam scene (Admin Only)
const addHotspot = async (sceneId, data) => {
  // Verifikasi scene asal ada
  const scene = await Scene.findByPk(sceneId);
  if (!scene) {
    const err = new Error("Scene asal tidak ditemukan.");
    err.statusCode = 404;
    throw err;
  }

  // LOGIKA VALIDASI BERDASARKAN TIPE
  if (data.type === "navigation") {
    // Jika Navigasi, pastikan target_scene_id ada dan valid
    if (!data.target_scene_id) {
      const err = new Error("target_scene_id wajib diisi untuk tipe navigasi.");
      err.statusCode = 400;
      throw err;
    }
    const target = await Scene.findByPk(data.target_scene_id);
    if (!target) {
      const err = new Error("Scene tujuan tidak ditemukan.");
      err.statusCode = 404;
      throw err;
    }
  } else {
    // Default: Tipe Product, pastikan product_id ada dan valid
    if (!data.product_id) {
      const err = new Error("product_id wajib diisi untuk tipe product.");
      err.statusCode = 400;
      throw err;
    }
    const product = await Product.findByPk(data.product_id);
    if (!product) {
      const err = new Error("Produk tidak ditemukan.");
      err.statusCode = 404;
      throw err;
    }
  }

  const hotspot = await Product3dHotspot.create({
    scene_id: sceneId,
    product_id: data.type === "navigation" ? null : data.product_id,
    target_scene_id: data.type === "navigation" ? data.target_scene_id : null,
    type: data.type || "product",
    icon_type:
      data.icon_type ||
      (data.type === "navigation" ? "arrow_up" : "shopping_cart"),
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
