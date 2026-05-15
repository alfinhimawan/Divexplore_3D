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

    // Berdasarkan dokumen WP-3.3.2, satu-satunya item yang eksplisit ditandai [Add-on] adalah Paket Spa / Sauna
    // yang merupakan bagian dari layanan Akomodasi Homestay.
    const pStandard = getProductId("Standard Garden View");
    const pDeluxe = getProductId("Deluxe Ocean View");
    const pBungalow = getProductId("Private Family Bungalow");

    const addonsData = [
      [pStandard, "Paket Spa / Sauna", 250000],
      [pDeluxe, "Paket Spa / Sauna", 250000],
      [pBungalow, "Paket Spa / Sauna", 250000]
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
  },
};
