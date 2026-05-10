"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Review extends Model {
    static associate(models) {
      Review.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
      Review.belongsTo(models.Vendor, {
        foreignKey: "vendor_id",
        as: "vendor",
      });
      Review.belongsTo(models.Order, { foreignKey: "order_id", as: "order" });
      Review.belongsTo(models.Product, {
        foreignKey: "product_id",
        as: "product",
      });
    }
  }

  Review.init(
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
      vendor_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      order_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      product_id: {
        type: DataTypes.UUID,
        allowNull: true, // Ubah jadi true dulu untuk menghindari error existing data
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      komentar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Review",
    },
  );

  return Review;
};
