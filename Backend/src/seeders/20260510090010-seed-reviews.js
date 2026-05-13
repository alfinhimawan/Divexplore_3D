"use strict";
const { v4: uuidv4 } = require("uuid");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Ambil data user
    const users = await queryInterface.sequelize.query(
      `SELECT id from "Users" LIMIT 2;`
    );
    const userRows = users[0];
    if(userRows.length === 0) return;

    // Ambil data produk
    const products = await queryInterface.sequelize.query(
      `SELECT id, vendor_id from "Products";`
    );
    const productRows = products[0];
    if(productRows.length === 0) return;

    // Ambil data order, kalau kosong buat satu dummy
    let orders = await queryInterface.sequelize.query(
      `SELECT id from "Orders" LIMIT 1;`
    );
    let orderId;
    if (orders[0].length === 0) {
      orderId = uuidv4();
      await queryInterface.bulkInsert("Orders", [{
        id: orderId,
        user_id: userRows[0].id,
        status: "COMPLETED",
        total_harga: 500000,
        createdAt: new Date(),
        updatedAt: new Date()
      }]);
    } else {
      orderId = orders[0][0].id;
    }

    const reviews = [];
    const comments = [
      "Pengalaman luar biasa! Pelayanan vendor sangat profesional. Produk persis seperti yang dijelaskan. Pasti akan balik lagi pesan lewat Divexplore!",
      "Sangat membantu sekali ada platform lokal begini. Harga jujur tanpa hidden fee. Terus tingkatkan layanannya Divexplore!",
      "Panduan wisata ramah dan kompeten. Pemandangan bawah laut tidak pernah mengecewakan. Recommended!",
      "Proses booking cepat, pelayanan vendor di lapangan luar biasa. Dapat foto gratis yang bagus-bagus.",
      "Luar biasa! Harga lebih murah dibanding pesan di lokasi, plus dapat asuransi. Sangat recommended buat liburan."
    ];

    for (let i = 0; i < productRows.length; i++) {
      const prod = productRows[i];
      // Insert 2 reviews per product
      reviews.push({
        id: uuidv4(),
        user_id: userRows[0].id,
        vendor_id: prod.vendor_id,
        order_id: orderId,
        product_id: prod.id,
        rating: 5,
        komentar: comments[i % comments.length],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      if (userRows.length > 1) {
        reviews.push({
          id: uuidv4(),
          user_id: userRows[1].id,
          vendor_id: prod.vendor_id,
          order_id: orderId,
          product_id: prod.id,
          rating: 4,
          komentar: "Secara keseluruhan sangat baik, pelayanannya top! Sangat memuaskan.",
          createdAt: new Date(new Date().getTime() - 86400000), // Kemarin
          updatedAt: new Date(new Date().getTime() - 86400000)
        });
      }
    }

    await queryInterface.bulkInsert("Reviews", reviews);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("Reviews", null, {});
  }
};
