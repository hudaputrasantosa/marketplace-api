const { body } = require("express-validator");

const tambahProdukValidation = [
  body("nama", "Nama Produk is requied").notEmpty(),
  body("harga", "Harga is requied and numeric")
    .notEmpty()
    .isAlphanumeric()
    .matches(/^(?=.*[0-9]).*$/),
  body("deskripsi", "deskripsi is required").notEmpty(),
  body("jumlah", "jumlah is required and numeric")
    .notEmpty()
    .isAlphanumeric()
    .matches(/^(?=.*[0-9]).*$/),
];
const ubahProdukValidation = [
  body("harga", "Harga is numeric")
    .optional()
    .isAlphanumeric()
    .matches(/^(?=.*[0-9]).*$/),
  body("jumlah", "jumlah is numeric")
    .optional()
    .isAlphanumeric()
    .matches(/^(?=.*[0-9]).*$/),
];

module.exports = { tambahProdukValidation, ubahProdukValidation };
