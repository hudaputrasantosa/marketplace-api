const { validationResult } = require("express-validator");
const { Op } = require("sequelize");
const { sequelize } = require("../models");

const Dompet = require("../models").Dompet;
const Produk = require("../models").Produk;
const Transaksi = require("../models").Transaksi;
//fungsi untuk melihat riwayat transaksi pada pembeli (by token)
const riwayatTransaksi = async (req, res) => {
  try {
    const { id } = req.user;
    const transaksi = await Transaksi.findAndCountAll({
      where: {
        id_user: id,
      },
    });
    transaksi
      ? res.status(200).json({
          status: "OK",
          message: "Berhasil Mengambil data riwayat transaksi",
          data: transaksi,
        })
      : res.status(404).json({
          status: "Notfound",
          message: "data transaksi tidak ditemukan",
        });
  } catch (error) {
    res.status(500).json({
      status: "Error",
      message: `Error at ${error}`,
    });
  }
};

//fungsi terjadinya/membuat transaksi pada pembelian produk oleh pembeli
const buatTransaksi = async (req, res) => {
  try {
    const { id_produk, kuantitas } = req.body;
    const { id } = req.user;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "Bad Request",
        errors: errors.array(),
      });
    }
    const checkStok = await Produk.findOne({
      where: {
        id: id_produk,
        jumlah: {
          [Op.and]: [
            {
              [Op.ne]: 0,
            },
            {
              [Op.gte]: kuantitas,
            },
          ],
        },
      },
      limit: 1,
    });
    if (checkStok && kuantitas !== 0) {
      const jumlah_harga = checkStok.harga * kuantitas;
      const checkDompetSaldo = await Dompet.findOne({
        where: {
          [Op.and]: [
            { id_user: id },
            {
              saldo: {
                [Op.gt]: jumlah_harga,
              },
            },
          ],
        },
        limit: 1,
      });

      if (checkDompetSaldo) {
        const result = await sequelize.transaction(async (t) => {
          let transaksi = await Transaksi.create(
            {
              id_produk: id_produk,
              id_user: id,
              kuantitas: kuantitas,
              jumlah_harga: jumlah_harga,
            },
            { lock: true, transaction: t }
          );

          await checkDompetSaldo.update(
            {
              saldo: (checkDompetSaldo.saldo -= jumlah_harga),
            },
            { lock: true, transaction: t }
          );

          await checkStok.update(
            {
              jumlah: (checkStok.jumlah -= kuantitas),
            },
            { lock: true, transaction: t }
          );
          return transaksi;
        });

        res.status(200).json({
          status: "OK",
          message: `Berhasil melakukan transaksi`,
          data: {
            produk: checkStok,
            transaksi: result,
          },
        });
        return;
      }
      res.status(409).json({
        status: "Conflict",
        message: "Belum mempunyai dompet atau saldo tidak memenuhi",
      });
    } else {
      res.status(409).json({
        status: "Conflict",
        message: "stok tidak tersedia/kuantitas melebihi stok/kuantitas 0",
      });
    }
  } catch (error) {
    await sequelize.transaction().rollback();
    res.status(500).json({
      status: "Error",
      message: `Error at ${error}`,
    });
  }
};

module.exports = { riwayatTransaksi, buatTransaksi };
