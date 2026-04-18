'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CrossSellingRule extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  CrossSellingRule.init({
    id: DataTypes.UUID,
    primary_product_id: DataTypes.UUID,
    addon_product_id: DataTypes.UUID
  }, {
    sequelize,
    modelName: 'CrossSellingRule',
  });
  return CrossSellingRule;
};