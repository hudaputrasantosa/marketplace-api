const bcrypt = require("bcryptjs/dist/bcrypt");
const { validationResult } = require("express-validator");

const User = require("../models").User;

const daftar = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "Bad Request",
        errors: errors.array(),
      });
    }

    const { nama, role, email, password } = req.body;
    const checkEmail = await User.findAndCountAll({
      where: {
        email: email.toLowerCase(),
      },
    });
    if (checkEmail.count > 0) {
      res.status(409).json({
        status: "Conflict",
        message: "Email sudah digunakan pada sistem",
      });
    } else {
      const hashedPassword = await bcrypt.hash(password, 8);
      const userCreated = await User.create({
        nama: nama,
        role: role,
        email: email.toLowerCase(),
        password: hashedPassword,
      });

      userCreated
        ? res.status(201).json({
            status: "OK",
            message: "Berhasil Mendaftar",
          })
        : res.status(400).json({
            status: "Bad Request",
            message: "Failed",
          });
    }
  } catch (error) {
    res.status(500).json({
      status: "Error",
      message: `Error at ${error}`,
    });
  }
};
const masuk = async (req, res) => {
  try {
  } catch (error) {}
};

module.exports = { daftar, masuk };
