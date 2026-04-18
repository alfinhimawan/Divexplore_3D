'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('VirtualLedgers', {
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
      order_id: {
        type: Sequelize.UUID
      },
      pendapatan_kotor: {
        type: Sequelize.DECIMAL
      },
      biaya_midtrans: {
        type: Sequelize.DECIMAL
      },
      potongan_komisi: {
        type: Sequelize.DECIMAL
      },
      pendapatan_bersih: {
        type: Sequelize.DECIMAL
      },
      status_pencairan: {
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
    await queryInterface.dropTable('VirtualLedgers');
  }
};