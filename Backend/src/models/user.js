"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasOne(models.Vendor, { foreignKey: "user_id", as: "vendor" });
      User.hasMany(models.UserConsent, {
        foreignKey: "user_id",
        as: "consents",
      });
      User.hasMany(models.Order, { foreignKey: "user_id", as: "orders" });
      User.hasMany(models.LoyaltyPoint, {
        foreignKey: "user_id",
        as: "loyaltyPoints",
      });
      User.hasMany(models.AuditLog, { foreignKey: "user_id", as: "auditLogs" });
      User.hasMany(models.Review, { foreignKey: "user_id", as: "reviews" });
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      nama_lengkap: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      auth_provider: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      google_id: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "User",
      // Selalu sembunyikan password_hash dari semua query secara default
      // Ini mencegah password_hash ikut terekspos di response API
      defaultScope: {
        attributes: { exclude: ["password_hash"] },
      },
      // Scope khusus saat butuh password_hash (login)
      scopes: {
        withPassword: { attributes: {} }, // ambil semua kolom termasuk password_hash
      },
    },
  );

  return User;
};
