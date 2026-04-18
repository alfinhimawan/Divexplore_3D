"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class VendorDocument extends Model {
    static associate(models) {
      VendorDocument.belongsTo(models.Vendor, {
        foreignKey: "vendor_id",
        as: "vendor",
      });
    }
  }

  VendorDocument.init(
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
      jenis_dokumen: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      file_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status_verifikasi: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending",
      },
      catatan_admin: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "VendorDocument",
    },
  );

  return VendorDocument;
};
