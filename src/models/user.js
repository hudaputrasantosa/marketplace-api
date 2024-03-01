"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      User.hasMany(models.Transaksi, {
        foreignKey: "id_user",
      });
      User.hasOne(models.Dompet, {
        foreignKey: "id_user",
      });
    }
  }
  User.init(
    {
      nama: DataTypes.STRING,
      role: DataTypes.ENUM("admin", "pembeli"),
      email: DataTypes.STRING,
      password: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "User",
    }
  );
  return User;
};
