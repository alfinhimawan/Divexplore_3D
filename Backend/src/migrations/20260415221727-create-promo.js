"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Promos", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      kode_promo: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      diskon_persen: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      max_potongan: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      valid_until: {
        type: Sequelize.DATE,
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
  async down(queryInterface) {
    await queryInterface.dropTable("Promos");
  },
};
