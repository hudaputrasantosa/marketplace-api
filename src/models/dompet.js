"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Dompet extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {}
  }
  Dompet.init(
    {
      id_user: DataTypes.INTEGER,
      no_ktp: DataTypes.STRING,
      saldo: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Dompet",
    }
  );
  return Dompet;
};
