"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Vendors", "rating", {
      type: Sequelize.DECIMAL(3, 2),
      allowNull: true,
      defaultValue: null,
      comment: "Rata-rata rating vendor, dikalkulasi otomatis setiap ada review baru",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("Vendors", "rating");
  },
};
