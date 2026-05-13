"use strict";
const { v4: uuidv4 } = require("uuid");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Buat 5 user wisatawan dummy
    const touristUsers = [
      { id: uuidv4(), nama_lengkap: "Budi Santoso", email: "budi.wisatawan@example.com", auth_provider: "local", role: "USER", createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), nama_lengkap: "Sari Dewi", email: "sari.dewi@example.com", auth_provider: "local", role: "USER", createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), nama_lengkap: "Agus Pratama", email: "agus.pratama@example.com", auth_provider: "local", role: "USER", createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), nama_lengkap: "Maya Rizka", email: "maya.rizka@example.com", auth_provider: "local", role: "USER", createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), nama_lengkap: "Reza Oktovian", email: "reza.oktovian@example.com", auth_provider: "local", role: "USER", createdAt: new Date(), updatedAt: new Date() }
    ];

    await queryInterface.bulkDelete("Users", { email: { [Sequelize.Op.like]: "%@example.com" } }, {});
    await queryInterface.bulkInsert("Users", touristUsers);

    // Ambil data produk
    const products = await queryInterface.sequelize.query(
      `SELECT id, vendor_id from "Products";`
    );
    const productRows = products[0];
    if(productRows.length === 0) return;

    // Buat order dummy untuk setiap user
    const orders = touristUsers.map(user => ({
      id: uuidv4(),
      user_id: user.id,
      status: "COMPLETED",
      total_pembayaran: 500000,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    await queryInterface.bulkInsert("Orders", orders);

    const reviews = [];
    const comments = [
      "Pengalaman luar biasa! Pelayanan vendor sangat profesional. Pasti akan balik lagi pesan lewat Divexplore!",
      "Sangat membantu sekali ada platform lokal begini. Harga jujur tanpa hidden fee.",
      "Panduan wisata ramah dan kompeten. Pemandangan bawah laut tidak pernah mengecewakan. Recommended!",
      "Proses booking cepat, pelayanan vendor di lapangan luar biasa. Dapat foto gratis yang bagus-bagus.",
      "Luar biasa! Harga lebih murah dibanding pesan di lokasi. Sangat recommended buat liburan.",
      "Fasilitas lengkap dan kapal sangat bersih. Nyaman sekali buat keluarga.",
      "Pertama kali ke sini dan sangat terbantu oleh sistem aplikasi Divexplore 3D. Mantap!",
      "Pemandu wisatanya sabar banget ngajarin snorkeling buat yang baru pertama kali."
    ];

    for (let i = 0; i < productRows.length; i++) {
      const prod = productRows[i];
      // Insert 3-5 reviews per product randomly
      const numReviews = Math.floor(Math.random() * 3) + 3; // 3 to 5 reviews
      
      for(let j = 0; j < numReviews; j++) {
        const randomUser = touristUsers[Math.floor(Math.random() * touristUsers.length)];
        const randomOrder = orders.find(o => o.user_id === randomUser.id);
        const randomRating = Math.random() > 0.3 ? 5 : 4; // 70% 5 stars, 30% 4 stars
        
        reviews.push({
          id: uuidv4(),
          user_id: randomUser.id,
          vendor_id: prod.vendor_id,
          order_id: randomOrder.id,
          product_id: prod.id,
          rating: randomRating,
          komentar: comments[Math.floor(Math.random() * comments.length)],
          createdAt: new Date(new Date().getTime() - Math.random() * 10000000000), // Random time in the past
          updatedAt: new Date()
        });
      }
    }

    await queryInterface.bulkInsert("Reviews", reviews);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("Reviews", null, {});
    await queryInterface.bulkDelete("Orders", { status: "COMPLETED", total_pembayaran: 500000 }, {});
    await queryInterface.bulkDelete("Users", { email: { [Sequelize.Op.like]: "%@example.com" } }, {});
  }
};
