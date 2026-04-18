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
        allowNull: false,
      },
      scene_id: {
        type: DataTypes.UUID,
        allowNull: false,
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
