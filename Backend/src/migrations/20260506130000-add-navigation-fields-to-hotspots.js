"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Ubah 'product_id' menjadi Nullable (karena hotspot navigasi tidak butuh produk)
    await queryInterface.changeColumn("Product3dHotspots", "product_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "Products",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });

    // 2. Tambah kolom 'type'
    await queryInterface.addColumn("Product3dHotspots", "type", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "product",
    });

    // 3. Tambah kolom 'target_scene_id' (untuk navigasi antar ruangan)
    await queryInterface.addColumn("Product3dHotspots", "target_scene_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "Scenes",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    // 4. Tambah kolom 'icon_type' (untuk membedakan visual marker)
    await queryInterface.addColumn("Product3dHotspots", "icon_type", {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: "shopping_cart",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Product3dHotspots", "type");
    await queryInterface.removeColumn("Product3dHotspots", "target_scene_id");
    await queryInterface.removeColumn("Product3dHotspots", "icon_type");
    
    // Kembalikan 'product_id' menjadi NOT NULL (opsional, tapi hati-hati jika sudah ada data null)
    await queryInterface.changeColumn("Product3dHotspots", "product_id", {
      type: Sequelize.UUID,
      allowNull: false,
    });
  },
};
