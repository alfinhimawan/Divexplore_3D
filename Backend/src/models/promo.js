'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Promo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Promo.init({
    id: DataTypes.UUID,
    kode_promo: DataTypes.STRING,
    diskon_persen: DataTypes.INTEGER,
    max_potongan: DataTypes.DECIMAL,
    valid_until: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Promo',
  });
  return Promo;
};