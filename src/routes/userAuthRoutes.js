const express = require("express");
const {
  daftarValidation,
  masukValidation,
} = require("../validator/userAuthValidation");
const {
  daftar,
  masuk,
  keluar,
  //   token,
} = require("../controllers/userAuthController");
const authenticatedToken = require("../middleware/authenticatedToken");
const router = express.Router();

// rute berbasis authentikasi khusus role pembeli dan admin
router.post("/daftar", daftarValidation, daftar);
router.post("/masuk", masukValidation, masuk);
router.post("/keluar", authenticatedToken, keluar);
// router.post("/token", token);

module.exports = router;
