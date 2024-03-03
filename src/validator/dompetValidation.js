const { body } = require("express-validator");

const tambahDompetValidation = [
  body("no_ktp", "Harga is requied and numeric")
    .notEmpty()
    .isLength({
      min: 16,
    })
    .isAlphanumeric()
    .matches(/^(?=.*[0-9]).*$/),
  body("saldo", "Saldo is requied and numeric")
    .optional()
    .isAlphanumeric()
    .matches(/^(?=.*[0-9]).*$/),
];

const setorSaldoValidation = [
  body("saldo", "Saldo is requied and numeric")
    .isAlphanumeric()
    .matches(/^(?=.*[0-9]).*$/),
];

module.exports = { tambahDompetValidation, setorSaldoValidation };
