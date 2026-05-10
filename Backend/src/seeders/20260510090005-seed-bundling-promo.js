"use strict";
const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const products = await queryInterface.sequelize.query(
      `SELECT id, nama_produk FROM "Products"`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const getProductId = (nama) => {
      const p = products.find(prod => prod.nama_produk === nama);
      return p ? p.id : null;
    };

    const islandHoppingSharing = getProductId("Open Tur Island Hopping (3 Gili — Sharing Boat)");
    const islandHoppingPrivate = getProductId("Open Tur Island Hopping (3 Gili — Private Boat)");
    const funDive = getProductId("Aktivitas Penyelaman — Fun Dive (2 Log)");
    const dsd = getProductId("Aktivitas Penyelaman — Discovery Scuba Dive (DSD 1 Log)");
    const jetski = getProductId("Aksi Bahari — Jetski (15 Menit)");
    const bananaBoat = getProductId("Aksi Bahari — Banana Boat (15 Menit, Kapasitas 5 Orang)");

    const snorkelSet = getProductId("Set Snorkel Premium + Kaki Katak (Sewa/Hari)");
    const goProCamera = getProductId("Kamera Aksi GoPro/Insta360 (Sewa/Hari)");
    const rashGuard = getProductId("Rash Guard / Wetsuit Ringan (Sewa/Hari)");
    const seafoodPlatter = getProductId("Paket Seafood Platter Saus Sukardi (Porsi 2 Orang)");
    const fotograferDarat = getProductId("Fotografer Darat / Pantai (Per Jam)");
    const drone = getProductId("Dokumentasi Udara — Drone DJI (Per Jam)");
    const deluxeRoom = getProductId("Kamar Deluxe Ocean View (Kapasitas 2 Orang)");
    const fotoBawahAir = getProductId("Pendampingan Foto Bawah Air (Per Jam)");

    const bundlingRules = [
      [islandHoppingSharing, snorkelSet],
      [islandHoppingSharing, goProCamera],
      [islandHoppingSharing, rashGuard],
      [islandHoppingSharing, seafoodPlatter],
      [islandHoppingSharing, fotograferDarat],
      [islandHoppingSharing, drone],
      [islandHoppingSharing, deluxeRoom],
      [islandHoppingPrivate, snorkelSet],
      [islandHoppingPrivate, drone],
      [funDive, goProCamera],
      [funDive, fotoBawahAir],
      [dsd, snorkelSet],
      [dsd, goProCamera],
      [jetski, fotograferDarat],
      [bananaBoat, fotograferDarat]
    ];

    const crossSellingData = bundlingRules
      .filter(([primary, addon]) => primary && addon)
      .map(([primary, addon]) => ({
        id: uuidv4(),
        primary_product_id: primary,
        addon_product_id: addon,
        createdAt: now,
      }));

    if (crossSellingData.length > 0) {
      await queryInterface.bulkInsert("CrossSellingRules", crossSellingData);
    }

    const scenes = await queryInterface.sequelize.query(
      `SELECT id, nama_scene FROM "Scenes" WHERE nama_scene = 'Kawasan 3 Gili — Lombok'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (scenes.length > 0) {
      const sceneId = scenes[0].id;
      const hotspots = [
        {
          id: uuidv4(),
          scene_id: sceneId,
          product_id: islandHoppingSharing,
          target_scene_id: null,
          type: "product",
          icon_type: "shopping_cart",
          coordinates_json: JSON.stringify({ x: 1.5, y: 0.5, z: -2.0 }),
          description: "Klik untuk pesan Island Hopping Sharing!",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: uuidv4(),
          scene_id: sceneId,
          product_id: funDive,
          target_scene_id: null,
          type: "product",
          icon_type: "shopping_cart",
          coordinates_json: JSON.stringify({ x: -1.0, y: 0.2, z: -3.5 }),
          description: "Klik untuk pesan Paket Fun Dive!",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: uuidv4(),
          scene_id: sceneId,
          product_id: drone,
          target_scene_id: null,
          type: "product",
          icon_type: "shopping_cart",
          coordinates_json: JSON.stringify({ x: 2.0, y: 1.5, z: 0.0 }),
          description: "Klik untuk pesan Dokumentasi Drone!",
          createdAt: now,
          updatedAt: now,
        }
      ].filter(h => h.product_id);

      if (hotspots.length > 0) {
        await queryInterface.bulkInsert("Product3dHotspots", hotspots);
      }
    }

    await queryInterface.bulkInsert("Promos", [
      {
        id: uuidv4(),
        kode_promo: "SUMMER3D",
        diskon_persen: 10,
        max_potongan: 100000,
        valid_until: new Date("2026-12-31"),
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        kode_promo: "GILI2026",
        diskon_persen: 15,
        max_potongan: 150000,
        valid_until: new Date("2026-08-31"),
        createdAt: now,
        updatedAt: now,
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("Promos", null, {});
    await queryInterface.bulkDelete("Product3dHotspots", null, {});
    await queryInterface.bulkDelete("CrossSellingRules", null, {});
  }
};
