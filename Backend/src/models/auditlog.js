"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class AuditLog extends Model {
    static associate(models) {
      AuditLog.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
    }
  }

  AuditLog.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      tabel_terdampak: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      data_lama: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      data_baru: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "AuditLog",
      updatedAt: false, // Tabel immutable — data log tidak boleh diedit
    },
  );

  return AuditLog;
};
