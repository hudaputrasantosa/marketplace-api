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
const { checkRolePembeli } = require("../middleware/checkRole");
const router = express.Router();

router.get("/detail", authenticatedToken, checkRolePembeli, lihatDompet);
router.post(
  "/tambah",
  authenticatedToken,
  checkRolePembeli,
  tambahDompetValidation,
  tambahDompet
);
router.post(
  "/setor-saldo",
  authenticatedToken,
  checkRolePembeli,
  setorSaldoValidation,
  setorSaldo
);
router.post(
  "/tarik-saldo",
  authenticatedToken,
  checkRolePembeli,
  setorSaldoValidation,
  tarikSaldo
);

module.exports = router;
