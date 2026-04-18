"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Promo extends Model {
    static associate(models) {
      Promo.hasMany(models.Order, { foreignKey: "promo_id", as: "orders" });
    }
  }

  Promo.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      kode_promo: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      diskon_persen: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      max_potongan: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
      },
      valid_until: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Promo",
    },
  );

  return Promo;
};
