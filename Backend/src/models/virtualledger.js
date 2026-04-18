'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class VirtualLedger extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  VirtualLedger.init({
    id: DataTypes.UUID,
    vendor_id: DataTypes.UUID,
    order_id: DataTypes.UUID,
    pendapatan_kotor: DataTypes.DECIMAL,
    biaya_midtrans: DataTypes.DECIMAL,
    potongan_komisi: DataTypes.DECIMAL,
    pendapatan_bersih: DataTypes.DECIMAL,
    status_pencairan: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'VirtualLedger',
  });
  return VirtualLedger;
};