const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const routes = require("../routes");
const helmet = require("helmet");
const limiter = require("./rateLimiter");
const errorMiddleware = require("../middleware/errorMiddleware");
const app = express();

const createServer = () => {
    let corsOption = {
        origin: "http://localhost:8080",
    };

    app.use(helmet());
    app.use(cors(corsOption));
    app.use(limiter);
    app.use(bodyParser.json());
    app.use(
        bodyParser.urlencoded({
            extended: true,
        })
    );
    app.use("/api", routes);
    app.use(errorMiddleware);

    return app;
};

module.exports = createServer;