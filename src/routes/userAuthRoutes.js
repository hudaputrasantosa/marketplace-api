const express = require("express");
const { daftarValidation, masukValidation } = require("../validator/userAuth");
const {
  daftar,
  masuk,
  keluar,
  //   token,
} = require("../controllers/userAuthController");
const authenticatedToken = require("../middleware/authenticatedToken");
const router = express.Router();

router.post("/daftar", daftarValidation, daftar);
router.post("/masuk", masukValidation, masuk);
router.post("/keluar", authenticatedToken, keluar);
// router.post("/token", token);

module.exports = router;
