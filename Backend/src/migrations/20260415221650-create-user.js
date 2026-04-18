"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Users", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      nama_lengkap: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: Sequelize.STRING,
        allowNull: true, // Nullable untuk login via Google
      },
      auth_provider: {
        type: Sequelize.STRING,
        allowNull: false, // 'local' atau 'google'
      },
      google_id: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      role: {
        type: Sequelize.STRING,
        allowNull: false, // 'wisatawan', 'vendor', 'admin'
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
    await queryInterface.dropTable("Users");
  },
};
