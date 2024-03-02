const { validationResult } = require("express-validator");

const Produk = require("../models").Produk;

const lihatProduks = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== "admin") {
      res.status(409).json({
        status: "Conflict",
        message: "Role anda bukan Admin!",
      });
    }
    const produks = await Produk.findAndCountAll();
    produks.count <= 0
      ? res.status(200).json({
          status: "OK",
          message: "Data Produk Kosong",
        })
      : res.status(200).json({
          status: "OK",
          message: "Berhasil Mengambil data",
          data: produks,
        });
  } catch (error) {
    res.status(500).json({
      status: "Error",
      message: `Error at ${error}`,
    });
  }
};
const lihatProduk = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== "admin") {
      res.status(409).json({
        status: "Conflict",
        message: "Role anda bukan Admin!",
      });
    }
    const produk = await Produk.findByPk(req.params.id);
    produk
      ? res.status(200).json({
          status: "OK",
          message: "Berhasil Mengambil data",
          data: produk,
        })
      : res.status(404).json({
          status: "Notfound",
          message: "Data Produk tidak ditemukan",
        });
  } catch (error) {
    res.status(500).json({
      status: "Error",
      message: `Error at ${error}`,
    });
  }
};

const tambahProduk = async (req, res) => {
  try {
    const { role } = req.user;
    const { nama, harga, deskripsi, jumlah } = req.body;
    const errors = validationResult(req);

    if (role !== "admin") {
      res.status(409).json({
        status: "Conflict",
        message: "Role anda bukan Admin!",
      });
    }
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "Bad Request",
        errors: errors.array(),
      });
    }
    const createdProduk = await Produk.create({
      nama: nama,
      harga: harga,
      deskripsi: deskripsi,
      jumlah: jumlah,
    });

    res.status(201).json({
      status: "Created",
      message: "Berhasil menambahkan data produk",
      data: createdProduk,
    });
  } catch (error) {
    res.status(500).json({
      status: "Error",
      message: `Error at ${error}`,
    });
  }
};

const ubahProduk = async (req, res) => {
  try {
    const { role } = req.user;
    const { nama, harga, deskripsi, jumlah } = req.body;
    const errors = validationResult(req);

    if (role !== "admin") {
      res.status(409).json({
        status: "Conflict",
        message: "Role anda bukan Admin!",
      });
    }

    let produk = await Produk.findByPk(req.params.id);
    if (produk) {
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "Bad Request",
          errors: errors.array(),
        });
      }

      produk.update({
        nama: nama,
        harga: harga,
        deskripsi: deskripsi,
        jumlah: jumlah,
      });

      res.status(201).json({
        status: "Created",
        message: "Berhasil memperbaharui data produk",
      });
    } else {
      res.status(404).json({
        status: "NotFound",
        message: "Data Produk tidak ditemukan",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "Error",
      message: `Error at ${error}`,
    });
  }
};
const hapusProduk = async (req, res) => {
  try {
    const { role } = req.user;

    if (role !== "admin") {
      res.status(409).json({
        status: "Conflict",
        message: "Role anda bukan Admin!",
      });
    }
    const produk = await Produk.destroy({
      where: {
        id: req.params.id,
      },
    });
    produk
      ? res.status(200).json({
          status: "OK",
          message: "Success menghapus data",
        })
      : res.status(404).json({
          status: "Not Found",
          message: "Gagal menghapus data karena data tidak ditemukan",
        });
  } catch (error) {
    res.status(500).json({
      status: "Error",
      message: `Error at ${error}`,
    });
  }
};

module.exports = {
  lihatProduks,
  lihatProduk,
  tambahProduk,
  ubahProduk,
  hapusProduk,
};