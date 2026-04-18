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
        allowNull: true,
      },
      harga: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
      },
      thumbnail_url: {
        type: DataTypes.TEXT, // TEXT — konsisten dengan migration (URL S3 bisa panjang)
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
    },
  );

  return Product;
};
