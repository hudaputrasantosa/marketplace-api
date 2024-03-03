const jwt = require("jsonwebtoken");

// middleare untuk pengecekan atau verifikasi token pengguna
const authenticatedToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res.status(401).json({
      status: "Unauthorized",
      message: "Token required",
    });

  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err)
      return res.status(403).send({
        status: "Forbidden",
        message: "Invalid or Expired Token",
      });
    req.user = user;
    next();
  });
};

module.exports = authenticatedToken;
