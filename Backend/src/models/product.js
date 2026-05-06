"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      Product.belongsTo(models.Vendor, {
        foreignKey: "vendor_id",
        as: "vendor",
      });
      Product.hasMany(models.Product3dHotspot, {
        foreignKey: "product_id",
        as: "hotspots",
      });
      Product.hasMany(models.ProductInventory, {
        foreignKey: "product_id",
        as: "inventories",
      });
      Product.hasMany(models.OrderItem, {
        foreignKey: "product_id",
        as: "orderItems",
      });
      Product.hasMany(models.CrossSellingRule, {
        foreignKey: "primary_product_id",
        as: "crossSellingAsMain",
      });
      Product.hasMany(models.CrossSellingRule, {
        foreignKey: "addon_product_id",
        as: "crossSellingAsAddon",
      });
      Product.hasMany(models.ProductAddon, {
        foreignKey: "product_id",
        as: "addons",
      });
    }
  }

  Product.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      vendor_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      nama_produk: {
        type: DataTypes.STRING,
        allowNull: false, // Wajib diisi
      },
      deskripsi: {
        type: DataTypes.TEXT,
        allowNull: true, // Tidak wajib
      },
      harga: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false, // Wajib diisi
      },
      thumbnail_url: {
        type: DataTypes.TEXT, // TEXT — URL bisa panjang (S3, CDN)
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "Product",
      paranoid: true, // Aktifkan Soft Delete (mengisi deletedAt, bukan hapus baris)
    },
  );

  return Product;
};
