"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
      Order.belongsTo(models.Promo, { foreignKey: "promo_id", as: "promo" });
      Order.hasMany(models.OrderItem, { foreignKey: "order_id", as: "items" });
      Order.hasMany(models.VirtualLedger, {
        foreignKey: "order_id",
        as: "ledgers",
      });
      Order.hasMany(models.LoyaltyPoint, {
        foreignKey: "order_id",
        as: "loyaltyPoints",
      });
      Order.hasMany(models.Review, { foreignKey: "order_id", as: "reviews" });
      Order.hasMany(models.PaymentLog, {
        foreignKey: "order_id",
        as: "paymentLogs",
      });
    }
  }

  Order.init(
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
      promo_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      total_pembayaran: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending",
      },
      timeout_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Order",
    },
  );

  return Order;
};
