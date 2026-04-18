'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Review extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Review.init({
    id: DataTypes.UUID,
    user_id: DataTypes.UUID,
    vendor_id: DataTypes.UUID,
    order_id: DataTypes.UUID,
    rating: DataTypes.INTEGER,
    komentar: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Review',
  });
  return Review;
};