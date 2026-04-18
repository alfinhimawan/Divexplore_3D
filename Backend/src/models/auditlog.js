'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AuditLog extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  AuditLog.init({
    id: DataTypes.UUID,
    user_id: DataTypes.UUID,
    tabel_terdampak: DataTypes.STRING,
    data_lama: DataTypes.TEXT,
    data_baru: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'AuditLog',
  });
  return AuditLog;
};