const express = require("express");
const userAuthRoutes = require("./userAuthRoutes");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("../config/swagger.json");
const router = express.Router();

router.use("/auth", userAuthRoutes);
router.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

module.exports = router;
