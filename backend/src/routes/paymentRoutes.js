const express = require("express");
const crypto = require("crypto");
const razorpayInstance = require("../services/razorpay");
const { authenticateUser } = require("../middlewares/authMiddleware");
const { readJsonFile, writeJsonFile } = require("../utils/jsonDb");
const { getReceiptFilePath } = require("../services/pdfGenerator");
const fs = require("fs");

const router = express.Router();

const getRazorpayErrorMessage = (error) => {
  return error.error?.description || error.error?.reason || error.message || "Failed to create payment order.";
};

const buildPaymentVerificationResponse = (registration, payment) => ({
  success: true,
  message: registration.paymentStatus === "Confirmed"
    ? "Payment is already approved and receipt is available."
    : "Payment successful. Your receipt will be available after admin approval.",
  paymentId: payment?.paymentId || registration.paymentId || "",
  registrationId: registration.id,
  amount: registration.paymentAmount,
  date: payment?.createdAt || registration.paymentCapturedAt || registration.updatedAt,
  paymentStatus: registration.paymentStatus,
  receiptUrl: registration.paymentStatus === "Confirmed" ? (registration.receiptUrl || `/receipt/${registration.id}`) : "",
  idempotent: Boolean(payment),
});

// @route POST /api/payments/create-order
// @desc Create Razorpay order
router.post("/create-order", authenticateUser, async (req, res) => {
  const { registrationId } = req.body;

  try {
    const registrations = await readJsonFile("registrations.json");
    const registrationIndex = registrations.findIndex(r => r.id === registrationId && r.userId === req.user.id);
    const registration = registrations[registrationIndex];

    if (!registration) {
      return res.status(404).json({ error: "Registration not found or unauthorized." });
    }

    if (registration.paymentStatus === "Confirmed") {
      return res.status(400).json({ error: "Payment already approved for this registration." });
    }

    if (registration.paymentStatus === "Pending Admin Approval" || registration.paymentStatus === "Pending Admin Confirmation") {
      return res.status(400).json({ error: "Payment already captured. Awaiting admin approval." });
    }

    if (!razorpayInstance) {
      return res.status(500).json({
        error: "Razorpay is not configured. Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.",
      });
    }

    const amount = registration.paymentAmount * 100;
    if (registration.razorpayOrderId && registration.razorpayOrderAmount === amount) {
      return res.json({
        id: registration.razorpayOrderId,
        amount,
        currency: registration.razorpayOrderCurrency || "INR",
        receipt: `receipt_${registration.id}`,
        status: registration.razorpayOrderStatus || "created",
        keyId: process.env.RAZORPAY_KEY_ID,
        idempotent: true,
      });
    }

    const options = {
      amount, // Amount in paise
      currency: "INR",
      receipt: `receipt_${registration.id}`,
    };

    const order = await razorpayInstance.orders.create(options);
    registrations[registrationIndex] = {
      ...registration,
      razorpayOrderId: order.id,
      razorpayOrderAmount: order.amount,
      razorpayOrderCurrency: order.currency,
      razorpayOrderStatus: order.status,
      updatedAt: new Date().toISOString(),
    };
    await writeJsonFile("registrations.json", registrations);

    res.json({
      ...order,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    res.status(error.statusCode || 500).json({ error: getRazorpayErrorMessage(error) });
  }
});

const verifyPaymentHandler = async (req, res) => {
  const { registrationId, razorpay_order_id, razorpay_payment_id, razorpay_signature, mock } = req.body;

  try {
    const registrations = await readJsonFile("registrations.json");
    const regIndex = registrations.findIndex(r => r.id === registrationId && r.userId === req.user.id);

    if (regIndex === -1) {
      return res.status(404).json({ error: "Registration not found." });
    }

    const registration = registrations[regIndex];
    const payments = await readJsonFile("payments.json");
    const existingActivePayment = payments.find((payment) =>
      payment.registrationId === registration.id && payment.approvalStatus !== "Rejected"
    );

    if (existingActivePayment && (registration.paymentStatus !== "Pending Payment" || existingActivePayment.paymentId === razorpay_payment_id || mock)) {
      if (registration.paymentStatus === "Pending Admin Confirmation") {
        registration.paymentStatus = "Pending Admin Approval";
        registrations[regIndex] = registration;
        await writeJsonFile("registrations.json", registrations);
      }
      return res.json(buildPaymentVerificationResponse(registration, existingActivePayment));
    }

    // Signature verification logic
    if (!mock) {
      if (!razorpayInstance) {
        return res.status(500).json({ error: "Razorpay is not configured." });
      }

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: "Missing Razorpay payment verification details." });
      }

      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ error: "Invalid payment signature." });
      }
    }

    // Payment Successful
    const paymentId = mock ? `PAY-MOCK-${Date.now()}` : razorpay_payment_id;
    const paidAt = new Date().toISOString();

    const paymentPayload = {
      id: paymentId,
      paymentId: paymentId,
      orderId: razorpay_order_id || `mock_order_${Date.now()}`,
      registrationId: registration.id,
      registrationNumber: registration.id,
      userId: req.user.id,
      participantName: registration.fullName,
      phone: registration.phone,
      email: registration.email,
      vaccineName: registration.vaccineName,
      dose: registration.dose,
      appointmentDate: registration.appointmentDate,
      appointmentSlot: registration.appointmentSlot,
      amount: registration.paymentAmount,
      status: "Paid",
      approvalStatus: "Pending",
      method: mock ? "Mock" : "Razorpay",
      receiptUrl: "",
      createdAt: paidAt,
      updatedAt: paidAt,
    };

    const existingPaymentIndex = payments.findIndex((payment) =>
      payment.paymentId === paymentId || payment.registrationId === registration.id
    );

    let savedPayment;
    if (existingPaymentIndex >= 0) {
      savedPayment = {
        ...payments[existingPaymentIndex],
        ...paymentPayload,
        createdAt: payments[existingPaymentIndex].createdAt || paidAt,
      };
      payments[existingPaymentIndex] = savedPayment;
    } else {
      savedPayment = paymentPayload;
      payments.push(savedPayment);
    }
    await writeJsonFile("payments.json", payments);

    // Update Registration Status
    registration.status = "Payment Completed";
    registration.paymentStatus = "Pending Admin Approval";
    registration.paymentCapturedAt = registration.paymentCapturedAt || paidAt;
    registration.verificationStatus = registration.verificationStatus || "Pending";
    registration.paymentId = paymentId;
    registration.receiptUrl = "";
    registration.updatedAt = paidAt;
    await writeJsonFile("registrations.json", registrations);

    res.json({
      success: true,
      message: "Payment successful. Your receipt will be available after admin approval.",
      paymentId,
      registrationId: registration.id,
      amount: registration.paymentAmount,
      date: savedPayment.createdAt,
      paymentStatus: registration.paymentStatus,
      receiptUrl: "",
    });
  } catch (error) {
    console.error("Payment Verification Error:", error);
    res.status(500).json({ error: error.message || "Payment verification failed." });
  }
};

// @route POST /api/payments/verify
// @route POST /api/payment/verify-payment
// @desc Verify Razorpay payment and generate receipt
router.post("/verify", authenticateUser, verifyPaymentHandler);
router.post("/verify-payment", authenticateUser, verifyPaymentHandler);

// @route GET /api/payments/receipt/:paymentId
// @desc Download PDF Receipt
router.get("/receipt/:paymentId", authenticateUser, async (req, res) => {
  const { paymentId } = req.params;
  
  const payments = await readJsonFile("payments.json");
  const payment = payments.find(p => p.paymentId === paymentId);

  if (!payment) {
    return res.status(404).json({ error: "Payment record not found." });
  }

  const isApproved =
    payment.approvalStatus === "Approved" || payment.status === "Approved" || payment.status === "Success";

  if (!isApproved) {
    return res.status(403).json({ error: "Receipt is available only after admin approval." });
  }

  // Ensure user owns this payment or is admin
  if (payment.userId !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ error: "Unauthorized access to receipt." });
  }

  const fileName = `receipt-${payment.registrationId}.pdf`;
  const filePath = getReceiptFilePath(payment.registrationId);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Receipt PDF not found." });
  }

  res.download(filePath, fileName);
});

module.exports = router;
