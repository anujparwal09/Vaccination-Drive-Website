const express = require("express");
const { authenticateUser } = require("../middlewares/authMiddleware");
const { readJsonFile, writeJsonFile } = require("../utils/jsonDb");

const router = express.Router();

const VACCINES = [
  { id: "ceravac-hpv", name: "ceravac-HPV", price: 1800 },
  { id: "revac-b-hbv", name: "Revac-B+ -HBV vaccine", price: 75 }
];

function normalizeRegistration(record) {
  const rawPaymentStatus =
    record.paymentStatus ||
    (record.status === "Payment Completed" ? "Pending Admin Approval" : "Pending Payment");
  const paymentStatus =
    rawPaymentStatus === "Pending Admin Confirmation" ? "Pending Admin Approval" : rawPaymentStatus;

  return {
    ...record,
    paymentStatus,
    verificationStatus: record.verificationStatus || "Pending",
    appointmentSlot: record.appointmentSlot || "",
  };
}

// @route GET /api/registrations
// @desc Get registrations visible to the current user
router.get("/", authenticateUser, async (req, res) => {
  try {
    const registrations = await readJsonFile("registrations.json");
    const visibleRegistrations = ["admin", "staff"].includes(req.user.role)
      ? registrations
      : registrations.filter((r) => r.userId === req.user.id);

    visibleRegistrations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(visibleRegistrations.map(normalizeRegistration));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch registrations." });
  }
});

// @route POST /api/registrations
// @desc Create a new vaccination registration
router.post("/", authenticateUser, async (req, res) => {
  const { fullName, age, gender, phone, email, address, vaccineId, dose, appointmentDate, appointmentSlot } = req.body;

  const vaccine = VACCINES.find((v) => v.id === vaccineId);
  if (!vaccine) return res.status(400).json({ error: "Invalid vaccine selection." });

  try {
    const registrations = await readJsonFile("registrations.json");
    
    // Generate unique registration ID (e.g. REG-2026-0001)
    const currentYear = new Date().getFullYear();
    const yearPrefix = `REG-${currentYear}-`;
    const maxSerial = registrations.reduce((max, registration) => {
      if (!String(registration.id || "").startsWith(yearPrefix)) return max;
      const serial = Number(String(registration.id).slice(yearPrefix.length));
      return Number.isFinite(serial) ? Math.max(max, serial) : max;
    }, 0);
    const regId = `${yearPrefix}${String(maxSerial + 1).padStart(4, "0")}`;

    const newRegistration = {
      id: regId,
      userId: req.user.id,
      fullName: fullName || req.user.fullName,
      age: Number(age) || req.user.age || 0,
      gender: gender || req.user.gender || "Male",
      phone: phone || req.user.phone || "",
      email: email || req.user.email || "",
      address,
      vaccineId: vaccine.id,
      vaccineName: vaccine.name,
      dose,
      appointmentDate: appointmentDate || "",
      appointmentSlot: appointmentSlot || "",
      paymentAmount: vaccine.price,
      status: "Pending Payment",
      paymentStatus: "Pending Payment",
      verificationStatus: "Pending",
      verifiedAt: "",
      paymentId: "",
      receiptUrl: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    registrations.push(newRegistration);
    await writeJsonFile("registrations.json", registrations);

    res.status(201).json({
      message: "Vaccination registered successfully. Please proceed to payment.",
      registration: newRegistration
    });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ error: "Failed to create registration." });
  }
});

// @route GET /api/registrations/me
// @desc Get current user's registrations
router.get("/me", authenticateUser, async (req, res) => {
  try {
    const registrations = await readJsonFile("registrations.json");
    const myRegistrations = registrations.filter((r) => r.userId === req.user.id);
    myRegistrations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(myRegistrations.map(normalizeRegistration));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch registrations." });
  }
});

module.exports = router;
