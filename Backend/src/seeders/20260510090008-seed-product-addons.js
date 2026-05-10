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

    const pIslandHopping = getProductId("Open Tur Island Hopping (3 Gili — Sharing Boat)");
    const pFunDive = getProductId("Aktivitas Penyelaman — Fun Dive (2 Log)");
    const pDsd = getProductId("Aktivitas Penyelaman — Discovery Scuba Dive (DSD 1 Log)");
    const pJetski = getProductId("Aksi Bahari — Jetski (15 Menit)");
    const pDeluxe = getProductId("Kamar Deluxe Ocean View (Kapasitas 2 Orang)");

    const addonsData = [
      [pIslandHopping, "Asuransi Perjalanan (1 Hari)", 25000],
      [pIslandHopping, "Makan Siang di Kapal", 45000],
      [pIslandHopping, "Tiket Masuk Spot Penyelaman", 15000],
      [pFunDive, "Sertifikat Penyelaman Digital", 150000],
      [pFunDive, "Asuransi Penyelaman DAN", 50000],
      [pDsd, "Asuransi Penyelaman DAN", 50000],
      [pJetski, "Tambahan Waktu Berkendara", 150000],
      [pDeluxe, "Early Check-in", 100000],
      [pDeluxe, "Late Check-out", 100000],
      [pDeluxe, "Romantic Dinner Setup", 350000]
    ];

    const addons = addonsData
      .filter(([id]) => id)
      .map(([id, nama, harga]) => ({
        id: uuidv4(),
        product_id: id,
        nama_addon: nama,
        harga,
        createdAt: now,
        updatedAt: now,
      }));

    if (addons.length > 0) {
      await queryInterface.bulkInsert("ProductAddons", addons);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("ProductAddons", null, {});
  }
};
