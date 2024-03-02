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

router.get("/", authenticatedToken, lihatProduks);
router.get("/:id", authenticatedToken, lihatProduk);
router.post(
  "/tambah",
  authenticatedToken,
  tambahProdukValidation,
  tambahProduk
);
router.post("/ubah/:id", authenticatedToken, ubahProduk);
router.delete("/hapus/:id", authenticatedToken, hapusProduk);

module.exports = router;
