'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Transaksi extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Transaksi.init({
    id_produk: DataTypes.INTEGER,
    id_user: DataTypes.INTEGER,
    kuantitas: DataTypes.INTEGER,
    jumlah_harga: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Transaksi',
  });
  return Transaksi;
};