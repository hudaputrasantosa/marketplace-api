const checkRoleAdmin = (req, res, next) => {
  const { role } = req.user;
  if (role !== "admin") {
    res.status(409).json({
      status: "Conflict",
      message: "Role anda bukan Admin!",
    });
  }
  next();
};

const checkRolePembeli = (req, res, next) => {
  const { role } = req.user;
  if (role !== "pembeli") {
    res.status(409).json({
      status: "Conflict",
      message: "Role anda bukan Pembeli!",
    });
  }
  next();
};

module.exports = { checkRoleAdmin, checkRolePembeli };
