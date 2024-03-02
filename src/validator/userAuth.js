const { body } = require("express-validator");

const daftarValidation = [
  body("nama", "Nama is requied").notEmpty(),
  body("role", "Role is requied").notEmpty(),
  body("email", "Please include a valid email")
    .notEmpty()
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: true }),
  body("password", "Password must be 8 or more characters")
    .notEmpty()
    .isLength({
      min: 8,
    })
    .isAlphanumeric()
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).*$/),
];

const masukValidation = [
  body("email", "Please include a valid email")
    .notEmpty()
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: true }),
  body("password", "Password must be 8 or more characters")
    .notEmpty()
    .isLength({
      min: 8,
    }),
];

module.exports = { daftarValidation, masukValidation };
