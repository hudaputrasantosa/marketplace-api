const express = require("express");
const router = express.Router();
const authenticatedToken = require("../middleware/authenticatedToken");
const { checkRolePembeli } = require("../middleware/checkRole");
const {
  riwayatTransaksi,
  buatTransaksi,
} = require("../controllers/transaksiController");
const { buatTransaksiValidation } = require("../validator/transaksiValidation");

router.get("/riwayat", authenticatedToken, checkRolePembeli, riwayatTransaksi);
router.post(
  "/buat-transaksi",
  authenticatedToken,
  checkRolePembeli,
  buatTransaksiValidation,
  buatTransaksi
);

module.exports = router;
