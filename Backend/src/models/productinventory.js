'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProductInventory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  ProductInventory.init({
    id: DataTypes.UUID,
    product_id: DataTypes.UUID,
    tanggal_ketersediaan: DataTypes.DATEONLY,
    available_qty: DataTypes.INTEGER,
    locked_qty: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'ProductInventory',
  });
  return ProductInventory;
};