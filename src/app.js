const db = require("./models");
const logger = require("./utils/logger");
const createServer = require("./utils/server");
require("dotenv").config();

const app = createServer();
const PORT = process.env.PORT || 8080;

db.sequelize
  .sync()
  .then(() => {
    logger.info("sync and connect db..");
    app.listen(PORT, () => {
      console.log("server running.. http://localhost:8080/api/docs");
    });
  })
  .catch((err) => {
    logger.error(`failed sync database, get error ${err}`);
  });
