"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Product3dHotspot extends Model {
    static associate(models) {
      Product3dHotspot.belongsTo(models.Product, {
        foreignKey: "product_id",
        as: "product",
      });
      Product3dHotspot.belongsTo(models.Scene, {
        foreignKey: "scene_id",
        as: "scene",
      });
      // Asosiasi baru untuk navigasi antar scene
      Product3dHotspot.belongsTo(models.Scene, {
        foreignKey: "target_scene_id",
        as: "targetScene",
      });
    }
  }

  Product3dHotspot.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      product_id: {
        type: DataTypes.UUID,
        allowNull: true, // Berubah jadi true untuk mendukung navigasi
      },
      scene_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      target_scene_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "product",
      },
      icon_type: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "shopping_cart",
      },
      coordinates_json: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Product3dHotspot",
    },
  );

  return Product3dHotspot;
};
