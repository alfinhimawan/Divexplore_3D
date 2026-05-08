"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("OrderItems", "metadata", {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: "Menyimpan add-on IDs dan data tambahan yang dipilih wisatawan",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("OrderItems", "metadata");
  },
};
