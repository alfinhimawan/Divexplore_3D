'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class LoyaltyPoint extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  LoyaltyPoint.init({
    id: DataTypes.UUID,
    user_id: DataTypes.UUID,
    order_id: DataTypes.UUID,
    points_earned: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'LoyaltyPoint',
  });
  return LoyaltyPoint;
};