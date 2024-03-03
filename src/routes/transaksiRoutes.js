const express = require("express");
const router = express.Router();
const authenticatedToken = require("../middleware/authenticatedToken");
const { checkRolePembeli } = require("../middleware/checkRole");
const {
  riwayatTransaksi,
  buatTransaksi,
} = require("../controllers/transaksiController");
const { buatTransaksiValidation } = require("../validator/transaksiValidation");

// rute berbasis path transaksi khusus role pembeli
router.get("/riwayat", authenticatedToken, checkRolePembeli, riwayatTransaksi);
router.post(
  "/buat-transaksi",
  authenticatedToken,
  checkRolePembeli,
  buatTransaksiValidation,
  buatTransaksi
);

module.exports = router;
