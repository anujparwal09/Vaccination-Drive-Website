const jwt = require("jsonwebtoken");
const { getRequiredEnv } = require("./env");

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id || user._id,
      email: user.email,
      role: user.role,
    },
    getRequiredEnv("JWT_SECRET"),
    {
      expiresIn: "15m",
    }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user.id || user._id,
    },
    getRequiredEnv("JWT_REFRESH_SECRET"),
    {
      expiresIn: "7d",
    }
  );
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
};
