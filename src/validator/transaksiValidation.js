const { body } = require("express-validator");

const buatTransaksiValidation = [
  body("id_produk", "Harga is requied and numeric")
    .notEmpty()
    .isAlphanumeric()
    .matches(/^(?=.*[0-9]).*$/),
  body("kuantitas", "Saldo is requied and numeric")
    .notEmpty()
    .isAlphanumeric()
    .matches(/^(?=.*[0-9]).*$/),
];

module.exports = { buatTransaksiValidation };
