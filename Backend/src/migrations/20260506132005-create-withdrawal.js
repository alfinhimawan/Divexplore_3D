"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Withdrawals", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      vendor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "Vendors",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      jumlah: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      nama_bank: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      nomor_rekening: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      nama_pemilik_rekening: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("pending", "processed", "rejected"),
        defaultValue: "pending",
      },
      bukti_transfer_url: {
        type: Sequelize.TEXT,
        allowNull: true,
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
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Withdrawals");
  },
};
