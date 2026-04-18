'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Order.init({
    id: DataTypes.UUID,
    user_id: DataTypes.UUID,
    promo_id: DataTypes.UUID,
    total_pembayaran: DataTypes.DECIMAL,
    status: DataTypes.STRING,
    timeout_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Order',
  });
  return Order;
};