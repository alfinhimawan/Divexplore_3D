"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Products", "deskripsi", {
      type: Sequelize.TEXT,
      allowNull: true,
      after: "nama_produk", // Menaruh kolom ini tepat setelah nama_produk (MySQL/MariaDB only, di Postgres akan ditaruh di akhir)
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Products", "deskripsi");
  },
};
