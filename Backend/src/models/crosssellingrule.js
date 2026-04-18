"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class CrossSellingRule extends Model {
    static associate(models) {
      CrossSellingRule.belongsTo(models.Product, {
        foreignKey: "primary_product_id",
        as: "primaryProduct",
      });
      CrossSellingRule.belongsTo(models.Product, {
        foreignKey: "addon_product_id",
        as: "addonProduct",
      });
    }
  }

  CrossSellingRule.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      primary_product_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      addon_product_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "CrossSellingRule",
      updatedAt: false, // ERD tidak mendefinisikan updatedAt untuk tabel ini
    },
  );

  return CrossSellingRule;
};
