"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Vendor extends Model {
    static associate(models) {
      Vendor.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
      Vendor.hasMany(models.VendorDocument, {
        foreignKey: "vendor_id",
        as: "documents",
      });
      Vendor.hasMany(models.Product, {
        foreignKey: "vendor_id",
        as: "products",
      });
      Vendor.hasMany(models.OrderItem, {
        foreignKey: "vendor_id",
        as: "orderItems",
      });
      Vendor.hasMany(models.VirtualLedger, {
        foreignKey: "vendor_id",
        as: "ledgers",
      });
      Vendor.hasMany(models.Review, { foreignKey: "vendor_id", as: "reviews" });
      Vendor.hasMany(models.Withdrawal, {
        foreignKey: "vendor_id",
        as: "withdrawals",
      });
    }
  }

  Vendor.init(
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
        unique: true,
      },
      saldo_saat_ini: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },
      nama_toko: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      logo_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      nama_penanggung_jawab: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      no_telepon_bisnis: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      kategori: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      alamat_lengkap: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      link_google_maps: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      persentase_komisi: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
      },
      status_kyc: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending",
      },
      rating: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
        defaultValue: null,
        comment: "Rata-rata rating 1.00 - 5.00, dikalkulasi ulang setiap ada review baru",
      },
    },
    {
      sequelize,
      modelName: "Vendor",
    },
  );

  return Vendor;
};
