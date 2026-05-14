'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Orders', 'last_midtrans_id', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Menyimpan ID transaksi Midtrans terakhir (termasuk suffix timestamp)'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Orders', 'last_midtrans_id');
  }
};
