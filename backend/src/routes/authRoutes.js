const express = require("express");
const passport = require("passport");
const {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  googleAuthCallback,
  getMe,
  updateProfile,
} = require("../controllers/authController");
const { authenticateUser } = require("../middlewares/authMiddleware");

const router = express.Router();

const requireGoogleOAuth = (req, res, next) => {
  if (!passport.isGoogleOAuthConfigured) {
    return res.status(503).json({
      error: "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
    });
  }
  next();
};

// Local Auth
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.get("/me", authenticateUser, getMe);
router.put("/profile", authenticateUser, updateProfile);

// Password recovery
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Email verification removed

// Google OAuth initiating redirect
router.get(
  "/google",
  requireGoogleOAuth,
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// Google OAuth callback redirect from Google consent page
router.get(
  "/google/callback",
  requireGoogleOAuth,
  passport.authenticate("google", {
    session: false,
  }),
  googleAuthCallback
);

module.exports = router;
