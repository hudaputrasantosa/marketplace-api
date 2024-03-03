// middleware untuk pengecekan role admin pada endpoint yang terproteksi auth
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

// middleware untuk pengecekan role pembeli pada endpoint yang terproteksi auth
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
