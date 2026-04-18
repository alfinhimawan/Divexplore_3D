"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class UserConsent extends Model {
    static associate(models) {
      UserConsent.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
    }
  }

  UserConsent.init(
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
      policy_version: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_agreed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      agreed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "UserConsent",
    },
  );

  return UserConsent;
};
