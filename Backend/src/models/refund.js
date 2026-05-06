"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Refund extends Model {
    static associate(models) {
      Refund.belongsTo(models.Order, {
        foreignKey: "order_id",
        as: "order",
      });
      Refund.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
    }
  }
  Refund.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      order_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      alasan_refund: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      jumlah_refund: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("pending", "approved", "rejected"),
        defaultValue: "pending",
      },
      catatan_admin: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Refund",
    },
  );
  return Refund;
};
