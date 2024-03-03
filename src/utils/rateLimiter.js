const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minute
  limit: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message:
    "Too many accounts created from this IP, please try again after a minute",
});

module.exports = limiter;
