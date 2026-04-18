'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('VendorDocuments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id: {
        type: Sequelize.UUID
      },
      vendor_id: {
        type: Sequelize.UUID
      },
      jenis_dokumen: {
        type: Sequelize.STRING
      },
      file_url: {
        type: Sequelize.STRING
      },
      status_verifikasi: {
        type: Sequelize.STRING
      },
      catatan_admin: {
        type: Sequelize.TEXT
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
    await queryInterface.dropTable('VendorDocuments');
  }
};