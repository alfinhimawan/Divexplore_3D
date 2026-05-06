"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Withdrawal extends Model {
    static associate(models) {
      Withdrawal.belongsTo(models.Vendor, {
        foreignKey: "vendor_id",
        as: "vendor",
      });
    }
  }
  Withdrawal.init(
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
      jumlah: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      nama_bank: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      nomor_rekening: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      nama_pemilik_rekening: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("pending", "processed", "rejected"),
        defaultValue: "pending",
      },
      bukti_transfer_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Withdrawal",
    },
  );
  return Withdrawal;
};
