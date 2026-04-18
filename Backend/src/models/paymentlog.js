'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PaymentLog extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  PaymentLog.init({
    id: DataTypes.UUID,
    order_id: DataTypes.UUID,
    transaction_id_midtrans: DataTypes.STRING,
    payment_type: DataTypes.STRING,
    status_pembayaran: DataTypes.STRING,
    raw_response: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'PaymentLog',
  });
  return PaymentLog;
};