"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Dompet extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Dompet.hasOne(models.Transaksi, {
        foreignKey: "id_produk",
      });
    }
  }
  Dompet.init(
    {
      id_user: DataTypes.INTEGER,
      no_ktp: DataTypes.INTEGER,
      saldo: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Dompet",
    }
  );
  return Dompet;
};
