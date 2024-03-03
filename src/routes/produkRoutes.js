const express = require("express");
const router = express.Router();
const authenticatedToken = require("../middleware/authenticatedToken");
const {
  lihatProduk,
  tambahProduk,
  ubahProduk,
  hapusProduk,
  lihatProduks,
} = require("../controllers/produkController");
const {
  tambahProdukValidation,
  ubahProdukValidation,
} = require("../validator/produkValidation");
const { checkRoleAdmin } = require("../middleware/checkRole");

// rute berbasis path produk khusus role admin
router.get("/", authenticatedToken, checkRoleAdmin, lihatProduks);
router.get("/:id", authenticatedToken, checkRoleAdmin, lihatProduk);
router.post(
  "/tambah",
  authenticatedToken,
  checkRoleAdmin,
  tambahProdukValidation,
  tambahProduk
);
router.post(
  "/ubah/:id",
  authenticatedToken,
  checkRoleAdmin,
  ubahProdukValidation,
  ubahProduk
);
router.delete("/hapus/:id", authenticatedToken, checkRoleAdmin, hapusProduk);

module.exports = router;
