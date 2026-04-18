"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class VirtualLedger extends Model {
    static associate(models) {
      VirtualLedger.belongsTo(models.Vendor, {
        foreignKey: "vendor_id",
        as: "vendor",
      });
      VirtualLedger.belongsTo(models.Order, {
        foreignKey: "order_id",
        as: "order",
      });
    }
  }

  VirtualLedger.init(
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
      order_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      pendapatan_kotor: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
      },
      biaya_midtrans: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
      },
      potongan_komisi: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
      },
      pendapatan_bersih: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
      },
      status_pencairan: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "unpaid",
      },
    },
    {
      sequelize,
      modelName: "VirtualLedger",
    },
  );

  return VirtualLedger;
};
