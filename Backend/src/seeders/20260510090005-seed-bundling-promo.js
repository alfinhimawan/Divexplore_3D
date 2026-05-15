"use strict";
const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const products = await queryInterface.sequelize.query(
      `SELECT id, nama_produk FROM "Products"`,
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );

    const getProductId = (nama) => {
      const p = products.find((prod) => prod.nama_produk === nama);
      return p ? p.id : null;
    };

    // --- Produk Utama (Aktivitas) dengan Nama Eksak ---
    const pIslandHoppingSharing = getProductId(
      "Open Tur Island Hopping (3 Gili: Trawangan, Meno, Air) - Sharing Boat",
    );
    const pIslandHoppingPrivate = getProductId(
      "Open Tur Island Hopping (3 Gili: Trawangan, Meno, Air) - Private Boat",
    );
    const pDivingDsd = getProductId(
      "Aktivitas Penyelaman Diving (Discovery Scuba Dive/DSD)",
    );
    const pDivingFun = getProductId(
      "Aktivitas Penyelaman Diving (Fun Dive 2 Log)",
    );
    const pJetski = getProductId("Aksi & Petualangan Bahari (Jetski)");
    const pBananaBoat = getProductId("Aksi & Petualangan Bahari (Banana Boat)");
    const pPaddle = getProductId(
      "Eksplorasi Pesisir & Rekreasi (Stand-up Paddle)",
    );
    const pKayak = getProductId(
      "Eksplorasi Pesisir & Rekreasi (Kayak Transparan)",
    );

    const mainProducts = [
      pIslandHoppingSharing,
      pIslandHoppingPrivate,
      pDivingDsd,
      pDivingFun,
      pJetski,
      pBananaBoat,
      pPaddle,
      pKayak,
    ].filter((id) => id);

    // --- Produk Add-on dengan Nama Eksak ---
    const pSnorkel = getProductId("Set Snorkel Premium + Kaki Katak");
    const pGoPro = getProductId("Kamera Aksi (GoPro/Insta360)");
    const pDryBag = getProductId("Dry Bag (Tas Anti Air 10L)");
    const pSunblock = getProductId("Sunblock Ramah Terumbu Karang");
    const pWetsuit = getProductId("Rash Guard / Wetsuit Ringan");
    const pStandard = getProductId("Standard Garden View");
    const pDeluxe = getProductId("Deluxe Ocean View");
    const pBungalow = getProductId("Private Family Bungalow");
    const pSpa = getProductId("Paket Spa / Sauna");
    const pSeafood = getProductId("Paket Seafood Platter Saus Sukardi");
    const pFotoDarat = getProductId("Fotografer Darat/Pantai");
    const pFotoBawahAir = getProductId("Pendampingan Foto Bawah Air");
    const pDrone = getProductId("Dokumentasi Udara (Drone)");

    const addonIds = [
      pSnorkel,
      pGoPro,
      pDryBag,
      pSunblock,
      pWetsuit,
      pStandard,
      pDeluxe,
      pBungalow,
      pSpa,
      pSeafood,
      pFotoDarat,
      pFotoBawahAir,
      pDrone,
    ].filter((id) => id);

    const crossSellingRules = [];
    mainProducts.forEach((mainId) => {
      addonIds.forEach((addonId) => {
        crossSellingRules.push({
          id: uuidv4(),
          primary_product_id: mainId,
          addon_product_id: addonId,
          createdAt: now,
        });
      });
    });

    if (crossSellingRules.length > 0) {
      await queryInterface.bulkInsert("CrossSellingRules", crossSellingRules);
    }

    // --- Hotspots 3D ---
    const scenes = await queryInterface.sequelize.query(
      `SELECT id, nama_scene FROM "Scenes" WHERE nama_scene = 'Kawasan 3 Gili — Lombok'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );

    if (scenes.length > 0) {
      const sceneId = scenes[0].id;
      const hotspots = [
        {
          id: uuidv4(),
          scene_id: sceneId,
          product_id: pIslandHoppingSharing,
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
          product_id: pDivingFun,
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
          product_id: pDrone,
          target_scene_id: null,
          type: "product",
          icon_type: "shopping_cart",
          coordinates_json: JSON.stringify({ x: 2.0, y: 1.5, z: 0.0 }),
          description: "Klik untuk pesan Dokumentasi Drone!",
          createdAt: now,
          updatedAt: now,
        },
      ].filter((h) => h.product_id);

      if (hotspots.length > 0) {
        await queryInterface.bulkInsert("Product3dHotspots", hotspots);
      }
    }

    // --- Promos ---
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
      },
      {
        id: uuidv4(),
        kode_promo: "DIVEPROMO",
        diskon_persen: 20,
        max_potongan: 200000,
        valid_until: new Date("2026-06-30"),
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("Promos", null, {});
    await queryInterface.bulkDelete("Product3dHotspots", null, {});
    await queryInterface.bulkDelete("CrossSellingRules", null, {});
  },
};
