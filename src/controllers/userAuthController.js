const bcrypt = require("bcryptjs/dist/bcrypt");
const jwt = require("jsonwebtoken");
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "Bad Request",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;
    const checkEmail = await User.findOne({
      where: {
        email: email,
      },
    });
    if (checkEmail) {
      const checkPassword = await bcrypt.compare(password, checkEmail.password);
      if (!checkPassword) {
        res.status(401).json({
          status: "Unauthorized",
          message: "Invalid Password",
        });
      }
      const createToken = jwt.sign(
        {
          id: checkEmail.id,
          role: checkEmail.role,
        },
        process.env.SECRET_KEY,
        { expiresIn: "1h" }
      );
      // const refreshToken = jwt.sign(
      //   {
      //     email: checkEmail.email,
      //     role: checkEmail.role,
      //   },
      //   process.env.REFRESH_SECRET_KEY
      // );
      // refreshTokens.push(refreshToken);

      const data = {
        token: createToken,
        user: checkEmail,
      };
      res.status(200).json({
        status: "OK",
        message: "Berhasil Masuk sistem",
        data: data,
      });
    } else {
      res.status(401).json({
        status: "Unauthorized",
        message: "Email Invalid",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "Error",
      message: `Error at ${error}`,
    });
  }
};

const keluar = async (req, res) => {
  try {
    const authHeader = req.user["authorization"];
    if (authHeader) {
      req.token = authHeader.replace("Bearer ", " ");
    }
    res.status(200).json({
      status: "OK",
      message: "Berhasil keluar sistem",
    });
  } catch (error) {
    res.status(500).json({
      status: "Error",
      message: `Error at ${error}`,
    });
  }
};

// SKIP
// const token = async (req, res) => {
//   const { token } = req.body;

//   if (!token) {
//     return res.sendStatus(401);
//   }
//   console.log(refreshTokens);
//   if (!refreshTokens.includes(token)) {
//     return res.sendStatus(403);
//   }

//   jwt.verify(token, process.env.REFRESH_SECRET_KEY, (err, user) => {
//     if (err) {
//       return res.status(403).json({
//         message: "gagal verifikasi token",
//       });
//     }

//     const accessToken = jwt.sign(
//       {
//         email: user.email,
//         role: user.role,
//       },
//       process.env.SECRET_KEY,
//       { expiresIn: "1h" }
//     );

//     res.json({
//       accessToken,
//     });
//   });
// };

module.exports = { daftar, masuk, keluar };
