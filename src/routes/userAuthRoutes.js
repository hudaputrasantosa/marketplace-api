const express = require("express");
const { daftarValidation, masukValidation } = require("../validator/userAuth");
const { daftar, masuk } = require("../controllers/userAuthController");
const router = express.Router();

router.post("/daftar", daftarValidation, daftar);
router.post("/masuk", masukValidation, masuk);

module.exports = router;
