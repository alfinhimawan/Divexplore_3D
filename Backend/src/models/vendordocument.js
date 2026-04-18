'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class VendorDocument extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  VendorDocument.init({
    id: DataTypes.UUID,
    vendor_id: DataTypes.UUID,
    jenis_dokumen: DataTypes.STRING,
    file_url: DataTypes.STRING,
    status_verifikasi: DataTypes.STRING,
    catatan_admin: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'VendorDocument',
  });
  return VendorDocument;
};