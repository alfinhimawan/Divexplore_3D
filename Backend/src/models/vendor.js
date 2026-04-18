'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Vendor extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Vendor.init({
    id: DataTypes.UUID,
    user_id: DataTypes.UUID,
    nama_toko: DataTypes.STRING,
    nama_penanggung_jawab: DataTypes.STRING,
    no_telepon_bisnis: DataTypes.STRING,
    kategori: DataTypes.STRING,
    alamat_lengkap: DataTypes.TEXT,
    link_google_maps: DataTypes.STRING,
    persentase_komisi: DataTypes.DECIMAL,
    status_kyc: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Vendor',
  });
  return Vendor;
};