"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Update Tabel Vendors: Tambah Saldo
    await queryInterface.addColumn("Vendors", "saldo_saat_ini", {
      type: Sequelize.DECIMAL(15, 2),
      defaultValue: 0,
      allowNull: false,
    });

    // 2. Update Tabel Users: Tambah Detail Profil
    await queryInterface.addColumn("Users", "nomor_telepon", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("Users", "alamat", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn("Users", "foto_profil_url", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Vendors", "saldo_saat_ini");
    await queryInterface.removeColumn("Users", "nomor_telepon");
    await queryInterface.removeColumn("Users", "alamat");
    await queryInterface.removeColumn("Users", "foto_profil_url");
  },
};
