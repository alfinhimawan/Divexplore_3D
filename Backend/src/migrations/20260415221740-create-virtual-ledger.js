"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("VirtualLedgers", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      vendor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "Vendors",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "Orders",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      pendapatan_kotor: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      biaya_midtrans: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      potongan_komisi: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      pendapatan_bersih: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      status_pencairan: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "unpaid",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("VirtualLedgers");
  },
};
