const express = require("express");
const {
  tambahDompetValidation,
  setorSaldoValidation,
} = require("../validator/dompetValidation");
const {
  tambahDompet,
  lihatDompet,
  setorSaldo,
  tarikSaldo,
} = require("../controllers/dompetController");
const authenticatedToken = require("../middleware/authenticatedToken");
const router = express.Router();

router.get("/detail", authenticatedToken, lihatDompet);
router.post(
  "/tambah",
  authenticatedToken,
  tambahDompetValidation,
  tambahDompet
);
router.post(
  "/setor-saldo",
  authenticatedToken,
  setorSaldoValidation,
  setorSaldo
);
router.post(
  "/tarik-saldo",
  authenticatedToken,
  setorSaldoValidation,
  tarikSaldo
);

module.exports = router;
