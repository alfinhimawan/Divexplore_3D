"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class LoyaltyPoint extends Model {
    static associate(models) {
      LoyaltyPoint.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
      LoyaltyPoint.belongsTo(models.Order, {
        foreignKey: "order_id",
        as: "order",
      });
    }
  }

  LoyaltyPoint.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      order_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      points_earned: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "LoyaltyPoint",
      updatedAt: false, // Tabel immutable — berfungsi sebagai log poin masuk
    },
  );

  return LoyaltyPoint;
};
