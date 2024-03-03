const { validationResult } = require("express-validator");

const Dompet = require("../models").Dompet;

const lihatDompet = async (req, res) => {
  try {
    const { id, role } = req.user;
    if (role !== "pembeli") {
      res.status(409).json({
        status: "Conflict",
        message: "Role anda bukan Pembeli!",
      });
    }
    const dompet = await Dompet.findOne({
      where: {
        id_user: id,
      },
    });

    dompet
      ? res.status(200).json({
          status: "OK",
          message: "Berhasil Mengambil data",
          data: dompet,
        })
      : res.status(404).json({
          status: "Notfound",
          message: "Dompet tidak ditemukan",
        });
  } catch (error) {
    res.status(500).json({
      status: "Error",
      message: `Error at ${error}`,
    });
  }
};

const tambahDompet = async (req, res) => {
  try {
    const { id, role } = req.user;
    const { no_ktp, saldo } = req.body;
    const errors = validationResult(req);

    if (role !== "pembeli") {
      res.status(409).json({
        status: "Conflict",
        message: "Role anda bukan Pembeli!",
      });
    }
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "Bad Request",
        errors: errors.array(),
      });
    }
    const checkDompet = await Dompet.findOne({
      where: {
        id_user: id,
      },
    });
    if (checkDompet) {
      res.status(409).json({
        status: "Conflict",
        message: "Anda sudah memiliki Dompet",
      });
    }
    const createdDompet = await Dompet.create({
      id_user: id,
      no_ktp: no_ktp,
      saldo: saldo || 0,
    });

    res.status(201).json({
      status: "Created",
      message: "Berhasil membuat dompet",
      data: createdDompet,
    });
  } catch (error) {
    res.status(500).json({
      status: "Error",
      message: `Error at ${error}`,
    });
  }
};

const setorSaldo = async (req, res) => {
  try {
    const { id, role } = req.user;
    const { saldo } = req.body;
    const errors = validationResult(req);

    if (role !== "pembeli") {
      res.status(409).json({
        status: "Conflict",
        message: "Role anda bukan Pembeli!",
      });
    }
    const checkDompet = await Dompet.findOne({ where: { id_user: id } });
    if (checkDompet) {
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "Bad Request",
          errors: errors.array(),
        });
      }
      await checkDompet.update({
        saldo: (checkDompet.saldo += saldo),
      });
      res.status(200).json({
        status: "OK",
        message: `Berhasil menambah saldo sebesar ${saldo}`,
      });
    } else {
      res.status(404).json({
        status: "Notfound",
        message: "Anda belum mempunyai dompet, buat terlebih dahulu!",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "Error",
      message: `Error at ${error}`,
    });
  }
};

const tarikSaldo = async (req, res) => {
  try {
    const { id, role } = req.user;
    const { saldo } = req.body;
    const errors = validationResult(req);

    if (role !== "pembeli") {
      res.status(409).json({
        status: "Conflict",
        message: "Role anda bukan Pembeli!",
      });
    }

    const checkDompet = await Dompet.findOne({ where: { id_user: id } });
    if (checkDompet) {
      const checkSaldo = checkDompet.saldo >= saldo && saldo >= 5000;
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "Bad Request",
          errors: errors.array(),
        });
      }
      if (checkSaldo) {
        await checkDompet.update({
          saldo: (checkDompet.saldo -= saldo),
        });
        res.status(200).json({
          status: "OK",
          message: `Berhasil tarik saldo sebesar ${saldo}`,
        });
      } else {
        res.status(409).json({
          status: "Conflict",
          message:
            "Jumlah tarik saldo tidak mencukupi saldo anda saat ini atau minimal tarik saldo 5000",
        });
      }
    } else {
      res.status(404).json({
        status: "Notfound",
        message: "Anda belum mempunyai dompet, buat terlebih dahulu!",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "Error",
      message: `Error at ${error}`,
    });
  }
};

module.exports = { tambahDompet, lihatDompet, setorSaldo, tarikSaldo };
