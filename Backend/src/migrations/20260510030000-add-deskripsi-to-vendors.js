"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Vendors", "deskripsi_toko", {
      type: Sequelize.TEXT,
      allowNull: true,
      after: "nama_toko",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("Vendors", "deskripsi_toko");
  },
};
