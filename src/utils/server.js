const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const routes = require("../routes");
const helmet = require("helmet");
const app = express();

const createServer = () => {
  let corsOption = {
    origin: "http://localhost:8080",
  };

  app.use(helmet());
  app.use(cors(corsOption));
  app.use(bodyParser.json());
  app.use(
    bodyParser.urlencoded({
      extended: true,
    })
  );
  app.use("/api", routes);
  app.use((err, req, res, next) => {
    const errorStatus = err.status || 500;
    const errorMessage = err.message || "Something went Wrong!";
    return res.status(errorStatus).send({
      success: false,
      status: errorStatus,
      message: errorMessage,
      stack: err.stack,
    });
  });

  return app;
};

module.exports = createServer;
