"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("PaymentLogs", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
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
      transaction_id_midtrans: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      payment_type: {
        type: Sequelize.STRING,
        allowNull: true, // 'qris', 'gopay', 'bank_transfer'
      },
      status_pembayaran: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      raw_response: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        // Tidak ada updatedAt — respon payment gateway mutlak/immutable
      },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("PaymentLogs");
  },
};
