const { validationResult } = require("express-validator");

const Produk = require("../models").Produk;

//fungsi untuk melihat semua produk yang tersedia
const lihatProduks = async (req, res) => {
  try {
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

//fungsi untuk melihat 1 detail produk yang di pilih melalui parameter
const lihatProduk = async (req, res) => {
  try {
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
//fungsi untuk menambahkan produk oleh admin
const tambahProduk = async (req, res) => {
  try {
    const { nama, harga, deskripsi, jumlah } = req.body;
    const errors = validationResult(req);

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
//fungsi untuk mengubah data pada produk
const ubahProduk = async (req, res) => {
  try {
    const { nama, harga, deskripsi, jumlah } = req.body;
    const errors = validationResult(req);

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

//fungsi untuk menghapus data produk yang dipilih
const hapusProduk = async (req, res) => {
  try {
    const deletedProduk = await Produk.destroy({
      where: {
        id: req.params.id,
      },
    });
    deletedProduk
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
