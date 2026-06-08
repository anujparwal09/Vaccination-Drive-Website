const express = require("express");
const { authenticateUser, authorizeRoles } = require("../middlewares/authMiddleware");
const { readJsonFile } = require("../utils/jsonDb");

const router = express.Router();

// Apply admin role middleware to all routes in this file
router.use(authenticateUser, authorizeRoles("admin", "staff"));

// @route GET /api/admin/stats
// @desc Get dashboard statistics
router.get("/stats", async (req, res) => {
  try {
    const users = await readJsonFile("users.json");
    const registrations = await readJsonFile("registrations.json");
    const payments = await readJsonFile("payments.json");

    const totalRevenue = payments
      .filter((payment) => payment.approvalStatus === "Approved" || payment.status === "Approved")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const verifiedRegistrations = registrations.filter(r => r.paymentStatus === "Confirmed").length;

    res.json({
      totalUsers: users.length,
      totalRegistrations: registrations.length,
      verifiedRegistrations,
      totalRevenue
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to load statistics." });
  }
});

// @route GET /api/admin/users
// @desc Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await readJsonFile("users.json");
    // Remove passwords before sending to frontend
    const sanitizedUsers = users.map(u => {
      const { password, ...safeUser } = u;
      return safeUser;
    });
    res.json(sanitizedUsers);
  } catch (error) {
    res.status(500).json({ error: "Failed to load users." });
  }
});

// @route GET /api/admin/registrations
// @desc Get all registrations
router.get("/registrations", async (req, res) => {
  try {
    const registrations = await readJsonFile("registrations.json");
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ error: "Failed to load registrations." });
  }
});

// @route GET /api/admin/payments
// @desc Get all payments
router.get("/payments", async (req, res) => {
  try {
    const payments = await readJsonFile("payments.json");
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: "Failed to load payments." });
  }
});

module.exports = router;
