"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("AuditLogs", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true, // Nullable — bisa ada aksi sistem tanpa user
        references: {
          model: "Users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      tabel_terdampak: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      data_lama: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      data_baru: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        // Tidak ada updatedAt — data log tidak boleh diedit
      },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("AuditLogs");
  },
};
