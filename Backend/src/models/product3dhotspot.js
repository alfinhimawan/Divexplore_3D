'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Product3dHotspot extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Product3dHotspot.init({
    id: DataTypes.UUID,
    product_id: DataTypes.UUID,
    scene_id: DataTypes.UUID,
    coordinates_json: DataTypes.TEXT,
    description: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Product3dHotspot',
  });
  return Product3dHotspot;
};