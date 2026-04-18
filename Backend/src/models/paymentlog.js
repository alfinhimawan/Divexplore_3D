"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class PaymentLog extends Model {
    static associate(models) {
      PaymentLog.belongsTo(models.Order, {
        foreignKey: "order_id",
        as: "order",
      });
    }
  }

  PaymentLog.init(
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
      transaction_id_midtrans: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      payment_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status_pembayaran: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      raw_response: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "PaymentLog",
      updatedAt: false, // Tabel immutable — respon payment gateway mutlak
    },
  );

  return PaymentLog;
};
