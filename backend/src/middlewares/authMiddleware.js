const jwt = require("jsonwebtoken");
const { readJsonFile } = require("../utils/jsonDb");
const { getRequiredEnv } = require("../utils/env");

const authenticateUser = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: "Not authorized. No token found." });
  }

  try {
    const decoded = jwt.verify(token, getRequiredEnv("JWT_SECRET"));
    
    // Find user from local users.json file database
    const users = readJsonFile("users.json");
    const user = users.find((u) => u.id === decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: "User no longer exists." });
    }

    // Check if user email is verified
    if (!user.isVerified) {
      return res.status(403).json({ 
        error: "Email verification required.", 
        isVerified: false,
        email: user.email 
      });
    }

    // Expose user credentials safely (exclude password hash)
    const { password, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Access token expired. Please refresh.", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ error: "Not authorized, invalid token." });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied. Unauthorized resource." });
    }
    next();
  };
};

module.exports = {
  authenticateUser,
  authorizeRoles,
};
