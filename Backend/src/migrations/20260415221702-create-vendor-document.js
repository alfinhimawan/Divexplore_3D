"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("VendorDocuments", {
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
        onDelete: "CASCADE",
      },
      jenis_dokumen: {
        type: Sequelize.STRING,
        allowNull: true, // 'KTP', 'NIB', 'Sertifikat_Selam'
      },
      file_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status_verifikasi: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "pending",
      },
      catatan_admin: {
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
  async down(queryInterface) {
    await queryInterface.dropTable("VendorDocuments");
  },
};
