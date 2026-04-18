"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Scene extends Model {
    static associate(models) {
      Scene.hasMany(models.Product3dHotspot, {
        foreignKey: "scene_id",
        as: "hotspots",
      });
    }
  }

  Scene.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      nama_scene: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      panorama_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "Scene",
    },
  );

  return Scene;
};
