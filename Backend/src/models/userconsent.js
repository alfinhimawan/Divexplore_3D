'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserConsent extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  UserConsent.init({
    id: DataTypes.UUID,
    user_id: DataTypes.UUID,
    policy_version: DataTypes.STRING,
    is_agreed: DataTypes.BOOLEAN,
    agreed_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'UserConsent',
  });
  return UserConsent;
};