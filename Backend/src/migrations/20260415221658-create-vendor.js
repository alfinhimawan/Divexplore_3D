'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Vendors', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id: {
        type: Sequelize.UUID
      },
      user_id: {
        type: Sequelize.UUID
      },
      nama_toko: {
        type: Sequelize.STRING
      },
      nama_penanggung_jawab: {
        type: Sequelize.STRING
      },
      no_telepon_bisnis: {
        type: Sequelize.STRING
      },
      kategori: {
        type: Sequelize.STRING
      },
      alamat_lengkap: {
        type: Sequelize.TEXT
      },
      link_google_maps: {
        type: Sequelize.STRING
      },
      persentase_komisi: {
        type: Sequelize.DECIMAL
      },
      status_kyc: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Vendors');
  }
};