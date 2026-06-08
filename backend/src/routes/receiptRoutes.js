const express = require("express");
const fs = require("fs");
const { authenticateUser } = require("../middlewares/authMiddleware");
const { readJsonFile } = require("../utils/jsonDb");
const { generateReceipt, getReceiptFileName, getReceiptFilePath } = require("../services/pdfGenerator");

const router = express.Router();

// @route GET /api/receipt/:registrationId
// @desc Download receipt PDF for a completed registration
router.get("/:registrationId", authenticateUser, async (req, res) => {
  const { registrationId } = req.params;

  try {
    const registrations = readJsonFile("registrations.json");
    const payments = readJsonFile("payments.json");
    const users = readJsonFile("users.json");

    const registration = registrations.find((record) => record.id === registrationId);
    if (!registration) {
      return res.status(404).json({ error: "Registration not found." });
    }

    if (registration.userId !== req.user.id && !["admin", "staff"].includes(req.user.role)) {
      return res.status(403).json({ error: "Unauthorized access to receipt." });
    }

    const payment = payments.find((record) => record.registrationId === registrationId);
    if (!payment) {
      return res.status(404).json({ error: "Payment record not found for this registration." });
    }

    const isApproved =
      registration.paymentStatus === "Confirmed" &&
      (!payment.approvalStatus || payment.approvalStatus === "Approved" || payment.status === "Approved" || payment.status === "Success");

    if (!isApproved) {
      return res.status(403).json({ error: "Receipt is available only after admin approval." });
    }

    const fileName = getReceiptFileName(registrationId);
    const filePath = getReceiptFilePath(registrationId);

    if (!fs.existsSync(filePath)) {
      const user = users.find((record) => record.id === registration.userId) || req.user;
      await generateReceipt(payment, registration, user);
    }

    res.download(filePath, fileName);
  } catch (error) {
    console.error("Receipt Download Error:", error);
    res.status(500).json({ error: error.message || "Failed to download receipt." });
  }
});

module.exports = router;
