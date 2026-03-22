const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
const env = require("../config/env");
const prisma = require("../config/db");

const protect = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new ApiError(401, "Not authenticated. Please log in."));
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, env.jwt.secret);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        member: { select: { id: true, membershipType: true } },
      },
    });

    if (!user) return next(new ApiError(401, "User no longer exists."));

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError")
      return next(new ApiError(401, "Token expired. Please log in again."));
    if (err.name === "JsonWebTokenError")
      return next(new ApiError(401, "Invalid token."));
    next(err);
  }
};

const restrictTo = (...roles) => {
  return (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, "You do not have permission to perform this action."),
      );
    }
    next();
  };
};

module.exports = { protect, restrictTo };
