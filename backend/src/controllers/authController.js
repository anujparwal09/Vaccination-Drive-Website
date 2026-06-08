const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { readJson: readJsonFile, writeJson: writeJsonFile } = require("../utils/jsonStorage");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");

// Helper to set cookie
const setRefreshTokenCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // Changed to lax for cross-port local dev cookie sharing
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// 1. User Register
const register = async (req, res) => {
  const { fullName, email, password, phone, age, gender, address, avatar } = req.body;

  if (!fullName || !email || !password || !phone) {
    return res.status(400).json({ error: "Please fill in all registration fields." });
  }

  try {
    const users = await readJsonFile("users.json");
    
    // Check if user exists
    const userExists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
    if (userExists) {
      return res.status(400).json({ error: "Email already registered." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user object
    const newUserId = "USR" + Math.floor(1000 + Math.random() * 9000);
    const user = {
      id: newUserId,
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      age: age ? Number(age) : null,
      gender: gender || "Male",
      address: address || "",
      isVerified: true, // Auto-verified
      verificationToken: "",
      profileImage: avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fullName)}`,
      googleId: "",
      refreshToken: "",
      resetPasswordToken: "",
      resetPasswordExpires: null,
      role: "user",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Generate JWT tokens for auto-login
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;

    users.push(user);
    await writeJsonFile("users.json", users, { logMessage: "User Registered" });

    // Set HTTP-Only Cookie
    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      message: "Registration successful.",
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
        isVerified: user.isVerified,
        age: user.age,
        gender: user.gender
      }
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ error: "Internal server error during registration." });
  }
};

// 2. User Login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Please provide email and password." });
  }

  try {
    const users = await readJsonFile("users.json");
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // Verify password (if local user has a password set)
    const isMatch = user.password ? await bcrypt.compare(password, user.password) : false;
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // Generate JWT tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to user record in file db
    user.refreshToken = refreshToken;
    user.updatedAt = new Date().toISOString();
    
    const updatedUsers = users.map((u) => (u.id === user.id ? user : u));
    await writeJsonFile("users.json", updatedUsers, { logMessage: "User Session Updated" });

    // Set HTTP-Only Cookie
    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
        isVerified: user.isVerified,
        age: user.age,
        gender: user.gender
      }
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Internal server error during login." });
  }
};

// 3. User Logout
const logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    res.clearCookie("refreshToken");
    return res.status(200).json({ message: "Logged out." });
  }

  try {
    const users = await readJsonFile("users.json");
    const user = users.find((u) => u.refreshToken === refreshToken);
    
    if (user) {
      user.refreshToken = "";
      user.updatedAt = new Date().toISOString();
      const updatedUsers = users.map((u) => (u.id === user.id ? user : u));
      await writeJsonFile("users.json", updatedUsers, { logMessage: "User Logged Out" });
    }

    res.clearCookie("refreshToken");
    res.status(200).json({ message: "Successfully logged out." });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ error: "Internal server error during logout." });
  }
};

// 4. Refresh Token
const refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: "Session expired, please login again." });
  }

  try {
    const users = await readJsonFile("users.json");
    const user = users.find((u) => u.refreshToken === refreshToken);
    
    if (!user) {
      res.clearCookie("refreshToken");
      return res.status(401).json({ error: "Invalid session." });
    }

    // Generate new Access Token
    const accessToken = generateAccessToken(user);
    res.status(200).json({ accessToken });
  } catch (error) {
    console.error("Refresh Token Error:", error);
    res.status(500).json({ error: "Internal server error refreshing session." });
  }
};

// 5. Forgot Password
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Please provide your email address." });
  }

  try {
    const users = await readJsonFile("users.json");
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    
    // For security, do not disclose if email is in database
    if (!user) {
      return res.status(200).json({
        message: "If the email is registered, a password reset link has been sent."
      });
    }

    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
    user.updatedAt = new Date().toISOString();
    
    const updatedUsers = users.map((u) => (u.id === user.id ? user : u));
    await writeJsonFile("users.json", updatedUsers, { logMessage: "Password Reset Requested" });

    res.status(200).json({
      message: "If the email is registered, a password reset link has been sent."
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ error: "Internal server error sending reset email." });
  }
};

// 6. Reset Password
const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: "Token and password are required." });
  }

  try {
    const users = await readJsonFile("users.json");
    const user = users.find(
      (u) => u.resetPasswordToken === token && new Date(u.resetPasswordExpires) > new Date()
    );

    if (!user) {
      return res.status(400).json({ error: "Reset token is invalid or has expired." });
    }

    // Hash password and update user record
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = "";
    user.resetPasswordExpires = null;
    user.updatedAt = new Date().toISOString();

    const updatedUsers = users.map((u) => (u.id === user.id ? user : u));
    await writeJsonFile("users.json", updatedUsers, { logMessage: "Password Reset Completed" });

    res.status(200).json({ message: "Password updated successfully. You can now login." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ error: "Internal server error resetting password." });
  }
};

// Email verification removed

// 8. Google OAuth Callback
const googleAuthCallback = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Google authentication failed." });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const users = await readJsonFile("users.json");
    const dbUser = users.find((u) => u.id === user.id);
    if (dbUser) {
      dbUser.refreshToken = refreshToken;
      dbUser.updatedAt = new Date().toISOString();
      const updatedUsers = users.map((u) => (u.id === dbUser.id ? dbUser : u));
      await writeJsonFile("users.json", updatedUsers, { logMessage: "Google Session Updated" });
    }

    // Set refresh token in cookies
    setRefreshTokenCookie(res, refreshToken);

    // Return JSON with tokens and user details
    res.status(200).json({
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
        isVerified: user.isVerified,
        age: user.age,
        gender: user.gender
      }
    });
  } catch (error) {
    console.error("Google OAuth Callback Error:", error);
    res.status(500).json({ error: "Google OAuth callback error." });
  }
};

// 9. Fetch user profile
const getMe = async (req, res) => {
  try {
    res.status(200).json({
      user: req.user
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to load user profile." });
  }
};

// 10. Update user profile
const updateProfile = async (req, res) => {
  const { fullName, phone, age, gender } = req.body;
  try {
    const users = await readJsonFile("users.json");
    const userIndex = users.findIndex((u) => u.id === req.user.id);
    if (userIndex === -1) {
      return res.status(404).json({ error: "User not found." });
    }

    users[userIndex].fullName = fullName || users[userIndex].fullName;
    users[userIndex].phone = phone || users[userIndex].phone;
    users[userIndex].age = age ? Number(age) : users[userIndex].age;
    users[userIndex].gender = gender || users[userIndex].gender;
    users[userIndex].updatedAt = new Date().toISOString();

    await writeJsonFile("users.json", users, { logMessage: "User Profile Updated" });

    res.status(200).json({
      message: "Profile updated successfully.",
      user: {
        id: users[userIndex].id,
        fullName: users[userIndex].fullName,
        email: users[userIndex].email,
        phone: users[userIndex].phone,
        role: users[userIndex].role,
        profileImage: users[userIndex].profileImage,
        isVerified: users[userIndex].isVerified,
        age: users[userIndex].age,
        gender: users[userIndex].gender
      }
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ error: "Internal server error updating profile." });
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  googleAuthCallback,
  getMe,
  updateProfile,
};
