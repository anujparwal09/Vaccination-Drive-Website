const express = require("express");
const path = require("path");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const ExcelJS = require("exceljs");
const bcrypt = require("bcryptjs");

// Load .env from root directory
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { readJsonFile, writeJsonFile, initDbFiles } = require("./src/utils/jsonDb");
const passport = require("./src/config/passport");
const authRoutes = require("./src/routes/authRoutes");
const registrationRoutes = require("./src/routes/registrationRoutes");
const paymentRoutes = require("./src/routes/paymentRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const receiptRoutes = require("./src/routes/receiptRoutes");
const { authenticateUser, authorizeRoles } = require("./src/middlewares/authMiddleware");
const { generateReceipt } = require("./src/services/pdfGenerator");

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Initialize App and JSON files later

// Seed Default Admin User if not exists
const seedAdmin = async () => {
  try {
    const users = await readJsonFile("users.json");
    const adminExists = users.some((u) => u.role === "admin");
    if (!adminExists) {
      if (!process.env.ADMIN_PASSWORD) {
        console.warn("Admin user was not seeded because ADMIN_PASSWORD is not set.");
        return;
      }

      const defaultPassword = process.env.ADMIN_PASSWORD;
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(defaultPassword, salt);
      
      const adminUser = {
        id: "ADM-001",
        fullName: "System Admin",
        email: "admin@vaccinationdrive.org",
        password: hashedPassword,
        phone: "9999999999",
        role: "admin",
        isVerified: true,
        profileImage: "https://api.dicebear.com/7.x/adventurer/svg?seed=Admin",
        googleId: "",
        refreshToken: "",
        verificationToken: "",
        resetPasswordToken: "",
        resetPasswordExpires: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      users.push(adminUser);
      await writeJsonFile("users.json", users);
      console.log("Seeded default admin user: admin@vaccinationdrive.org");
    }
  } catch (err) {
    console.error("Admin seed error:", err.message);
  }
};
// Initialize App
const initApp = async () => {
  await initDbFiles();
  await seedAdmin();
};
initApp();

app.get("/.well-known/appspecific/com.chrome.devtools.json", (req, res) => {
  res.json({});
});

app.get("/", (req, res) => {
  res.redirect(CLIENT_URL);
});

// Middleware security configurations
app.use(helmet());
app.use(cookieParser());
app.use(cors({
  origin: CLIENT_URL,
  credentials: true
}));

// Rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // Max 150 requests per IP
  message: { error: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", apiLimiter);

app.use(express.json({ limit: "8mb" }));

// Passport middleware
app.use(passport.initialize());

// Router mappings
app.use("/api/auth", authRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/receipt", receiptRoutes);
app.use("/api/admin", adminRoutes);

// Vaccine metadata configs
const VACCINES = [
  { id: "ceravac-hpv", name: "ceravac-HPV", price: 1800 },
  { id: "revac-b-hbv", name: "Revac-B+ -HBV vaccine", price: 400 }
];

app.get("/api/config", (req, res) => {
  res.json({
    vaccines: VACCINES
  });
});

// Protected vaccination bookings endpoints are now handled by registrationRoutes and paymentRoutes

// Admin Panel endpoints
app.post("/api/admin/registrations", authenticateUser, authorizeRoles("admin"), async (req, res) => {
  try {
    const registrations = await readJsonFile("registrations.json");
    registrations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ error: "Failed to load registrations queue." });
  }
});

app.post("/api/admin/confirm-payment/:id", authenticateUser, authorizeRoles("admin", "staff"), async (req, res) => {
  try {
    const registrations = await readJsonFile("registrations.json");
    const bookingIndex = registrations.findIndex((r) => r.id === req.params.id);
    
    if (bookingIndex === -1) {
      return res.status(404).json({ error: "Booking record not found." });
    }

    const approvedAt = new Date().toISOString();
    const registration = registrations[bookingIndex];
    
    const payments = await readJsonFile("payments.json");
    let paymentIndex = payments.findIndex((payment) => payment.registrationId === registration.id);

    if (registration.paymentStatus === "Confirmed" && paymentIndex >= 0 && payments[paymentIndex].approvalStatus === "Approved") {
      registration.receiptUrl = registration.receiptUrl || `/receipt/${registration.id}`;
      payments[paymentIndex].receiptUrl = payments[paymentIndex].receiptUrl || `/receipt/${registration.id}`;
      await writeJsonFile("payments.json", payments);
      await writeJsonFile("registrations.json", registrations);

      const users = await readJsonFile("users.json");
      const user = users.find((u) => u.id === registration.userId) || registration;
      const receipt = await generateReceipt(payments[paymentIndex], registration, user);

      return res.json({
        message: "Payment was already approved. Receipt is available.",
        registration,
        payment: payments[paymentIndex],
        receiptUrl: receipt.receiptUrl,
        idempotent: true,
      });
    }

    if (paymentIndex === -1) {
      payments.push({
        id: `PAY-ADMIN-${Date.now()}`,
        paymentId: registration.paymentId || `PAY-ADMIN-${Date.now()}`,
        orderId: "",
        registrationId: registration.id,
        registrationNumber: registration.id,
        userId: registration.userId,
        participantName: registration.fullName,
        phone: registration.phone,
        email: registration.email,
        vaccineName: registration.vaccineName,
        dose: registration.dose,
        appointmentDate: registration.appointmentDate,
        appointmentSlot: registration.appointmentSlot,
        amount: registration.paymentAmount,
        status: "Approved",
        approvalStatus: "Approved",
        method: "Manual Admin Approval",
        receiptUrl: `/receipt/${registration.id}`,
        createdAt: registration.paymentCapturedAt || approvedAt,
        updatedAt: approvedAt,
        approvedAt,
        approvedBy: req.user.id,
      });
      paymentIndex = payments.length - 1;
    } else {
      payments[paymentIndex] = {
        ...payments[paymentIndex],
        registrationNumber: registration.id,
        participantName: registration.fullName,
        phone: registration.phone,
        email: registration.email,
        vaccineName: registration.vaccineName,
        dose: registration.dose,
        appointmentDate: registration.appointmentDate,
        appointmentSlot: registration.appointmentSlot,
        amount: registration.paymentAmount,
        status: "Approved",
        approvalStatus: "Approved",
        receiptUrl: `/receipt/${registration.id}`,
        updatedAt: approvedAt,
        approvedAt,
        approvedBy: req.user.id,
      };
    }

    registration.status = "Payment Completed";
    registration.paymentStatus = "Confirmed";
    registration.paymentConfirmedAt = approvedAt;
    registration.paymentId = payments[paymentIndex].paymentId;
    registration.receiptUrl = `/receipt/${registration.id}`;
    registration.updatedAt = approvedAt;

    await writeJsonFile("payments.json", payments);
    await writeJsonFile("registrations.json", registrations);

    const users = await readJsonFile("users.json");
    const user = users.find((u) => u.id === registration.userId) || registration;
    const receipt = await generateReceipt(payments[paymentIndex], registration, user);

    res.json({
      message: "Payment approved and receipt generated successfully.",
      registration,
      payment: payments[paymentIndex],
      receiptUrl: receipt.receiptUrl,
    });
  } catch (error) {
    console.error("Confirm payment error:", error);
    res.status(500).json({ error: "Failed to confirm payment." });
  }
});

const rejectPaymentHandler = async (req, res) => {
  try {
    const registrations = await readJsonFile("registrations.json");
    const bookingIndex = registrations.findIndex((r) => r.id === req.params.id);
    
    if (bookingIndex === -1) {
      return res.status(404).json({ error: "Booking record not found." });
    }

    const rejectedAt = new Date().toISOString();
    const registration = registrations[bookingIndex];

    if (registration.paymentStatus === "Not Approved") {
      return res.json({ message: "Payment is already marked not approved.", registration, idempotent: true });
    }

    registration.paymentStatus = "Not Approved";
    registration.status = "Payment Not Approved";
    registration.receiptUrl = "";
    registration.paymentRejectedAt = rejectedAt;
    registration.updatedAt = rejectedAt;
    
    await writeJsonFile("registrations.json", registrations);

    const payments = await readJsonFile("payments.json");
    const paymentIndex = payments.findIndex((payment) => payment.registrationId === registration.id);
    if (paymentIndex >= 0) {
      payments[paymentIndex] = {
        ...payments[paymentIndex],
        status: "Not Approved",
        approvalStatus: "Rejected",
        receiptUrl: "",
        updatedAt: rejectedAt,
        rejectedAt,
        rejectedBy: req.user.id,
      };
      await writeJsonFile("payments.json", payments);
    }

    res.json({ message: "Payment marked not approved.", registration });
  } catch (error) {
    console.error("Reject payment error:", error);
    res.status(500).json({ error: "Failed to mark payment not approved." });
  }
};

app.post("/api/admin/reject-payment/:id", authenticateUser, authorizeRoles("admin", "staff"), rejectPaymentHandler);
app.post("/api/admin/refund-payment/:id", authenticateUser, authorizeRoles("admin", "staff"), rejectPaymentHandler);

// Staff/Admin verify pass scan
app.post("/api/verify/:id", authenticateUser, authorizeRoles("admin", "staff"), async (req, res) => {
  try {
    const registrations = await readJsonFile("registrations.json");
    const bookingIndex = registrations.findIndex((r) => r.id === req.params.id);
    
    if (bookingIndex === -1) {
      return res.status(404).json({ error: "Booking record not found." });
    }

    if (registrations[bookingIndex].paymentStatus !== "Confirmed") {
      return res.status(400).json({ error: "Verification failed. Payment not confirmed." });
    }

    registrations[bookingIndex].verificationStatus = "Verified";
    registrations[bookingIndex].verifiedAt = new Date().toISOString();
    registrations[bookingIndex].updatedAt = new Date().toISOString();
    
    await writeJsonFile("registrations.json", registrations);

    // Save logs in verifications.json
    const verifications = await readJsonFile("verifications.json");
    verifications.push({
      id: "VER" + Math.floor(1000 + Math.random() * 9000),
      bookingId: req.params.id,
      verifiedBy: req.user.id,
      verifiedAt: new Date().toISOString()
    });
    await writeJsonFile("verifications.json", verifications);

    res.json({ message: "Participant verified successfully.", registration: registrations[bookingIndex] });
  } catch (error) {
    res.status(500).json({ error: "Verification check-in failed." });
  }
});

// Admin export excel report
app.post("/api/admin/excel", authenticateUser, authorizeRoles("admin"), async (req, res) => {
  try {
    const registrations = await readJsonFile("registrations.json");
    const users = await readJsonFile("users.json");
    const internalRoles = new Set(["admin", "staff"]);
    const usersById = new Map(users.map((user) => [user.id, user]));
    const internalEmails = new Set(
      users
        .filter((user) => internalRoles.has(String(user.role || "").toLowerCase()))
        .map((user) => String(user.email || "").toLowerCase())
        .filter(Boolean)
    );

    const formatDateTime = (value) => {
      if (!value) return "";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return String(value);
      return date.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    };

    const getBatchName = (registration) => (
      registration.batchName ||
      registration.batch ||
      [registration.appointmentDate, registration.appointmentSlot].filter(Boolean).join(" | ")
    );

    const getPaymentMode = (registration) => {
      if (registration.paymentMode) return registration.paymentMode;
      if (registration.paymentMethod) return registration.paymentMethod;
      if (!registration.paymentId) return "";
      return String(registration.paymentId).startsWith("PAY-MOCK") ? "Mock" : "Razorpay";
    };

    const isInternalRegistration = (registration) => {
      const owner = usersById.get(registration.userId);
      const ownerRole = String(owner?.role || registration.role || "").toLowerCase();
      const userId = String(registration.userId || "").toLowerCase();
      const email = String(registration.email || "").toLowerCase();

      return (
        internalRoles.has(ownerRole) ||
        userId.startsWith("adm-") ||
        userId.startsWith("staff-") ||
        userId.startsWith("stf-") ||
        (email && internalEmails.has(email))
      );
    };

    const exportRows = registrations
      .filter((registration) => !isInternalRegistration(registration))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Rotaract Club of Osmania Medical College";
    workbook.created = new Date();
    const sheet = workbook.addWorksheet("Registrations");

    sheet.columns = [
      { header: "Registration ID", key: "registrationId", width: 20 },
      { header: "Created At", key: "createdAt", width: 22 },
      { header: "Full Name", key: "fullName", width: 24 },
      { header: "Age", key: "age", width: 10 },
      { header: "Gender", key: "gender", width: 12 },
      { header: "Phone", key: "phone", width: 16 },
      { header: "Email", key: "email", width: 28 },
      { header: "Address", key: "address", width: 36 },
      { header: "Batch Name", key: "batchName", width: 26 },
      { header: "Vaccine", key: "vaccine", width: 24 },
      { header: "Dose", key: "dose", width: 12 },
      { header: "Payment Amount", key: "paymentAmount", width: 16 },
      { header: "Payment Mode", key: "paymentMode", width: 16 },
      { header: "UPI ID", key: "upiId", width: 22 },
      { header: "Payment Reference", key: "paymentReference", width: 28 },
      { header: "Payment Screenshot", key: "paymentScreenshot", width: 28 },
      { header: "Payment State", key: "paymentState", width: 22 },
      { header: "Payment Confirmed?", key: "paymentConfirmed", width: 20 },
      { header: "Verification Status", key: "verificationStatus", width: 22 },
      { header: "Verified At", key: "verifiedAt", width: 22 }
    ];

    exportRows.forEach((registration) => {
      const paymentConfirmed =
        registration.paymentStatus === "Confirmed" ||
        registration.approvalStatus === "Approved" ||
        Boolean(registration.receiptUrl);

      sheet.addRow({
        registrationId: registration.id || "",
        createdAt: formatDateTime(registration.createdAt),
        fullName: registration.fullName || "",
        age: registration.age || "",
        gender: registration.gender || "",
        phone: registration.phone || "",
        email: registration.email || "",
        address: registration.address || "",
        batchName: getBatchName(registration),
        vaccine: registration.vaccineName || "",
        dose: registration.dose || "",
        paymentAmount: Number(registration.paymentAmount || 0),
        paymentMode: getPaymentMode(registration),
        upiId: registration.upiId || registration.paymentUpiId || "",
        paymentReference: registration.paymentReference || registration.paymentId || "",
        paymentScreenshot: registration.paymentScreenshot || registration.paymentScreenshotUrl || "",
        paymentState: registration.paymentStatus || registration.status || "",
        paymentConfirmed: paymentConfirmed ? "Yes" : "No",
        verificationStatus: registration.verificationStatus || "Pending",
        verifiedAt: formatDateTime(registration.verifiedAt)
      });
    });

    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.autoFilter = "A1:T1";
    sheet.getColumn("paymentAmount").numFmt = '"Rs. " #,##0';

    const headerRow = sheet.getRow(1);
    headerRow.height = 22;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0F766E" }
      };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: "FFD1D5DB" } },
        left: { style: "thin", color: { argb: "FFD1D5DB" } },
        bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
        right: { style: "thin", color: { argb: "FFD1D5DB" } }
      };
    });

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.height = 20;
      row.eachCell((cell) => {
        cell.alignment = { vertical: "middle", wrapText: true };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE5E7EB" } },
          left: { style: "thin", color: { argb: "FFE5E7EB" } },
          bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
          right: { style: "thin", color: { argb: "FFE5E7EB" } }
        };
      });
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=vaccination_registrations.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Excel export error:", error);
    res.status(500).json({ error: "Failed to export Excel spreadsheet report." });
  }
});

// Admin export users report
app.post("/api/admin/users/excel", authenticateUser, authorizeRoles("admin"), async (req, res) => {
  try {
    const users = await readJsonFile("users.json");
    const registrations = await readJsonFile("registrations.json");

    const formatDateTime = (value) => {
      if (!value) return "";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return String(value);
      return date.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    };

    const exportUsers = users
      .filter((user) => !["admin", "staff"].includes(String(user.role || "").toLowerCase()))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const registrationsByUser = registrations.reduce((map, registration) => {
      if (!registration.userId) return map;
      const userRegistrations = map.get(registration.userId) || [];
      userRegistrations.push(registration);
      map.set(registration.userId, userRegistrations);
      return map;
    }, new Map());

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Rotaract Club of Osmania Medical College";
    workbook.created = new Date();
    const sheet = workbook.addWorksheet("Users");

    sheet.columns = [
      { header: "User ID", key: "userId", width: 16 },
      { header: "Full Name", key: "fullName", width: 26 },
      { header: "Email", key: "email", width: 32 },
      { header: "Phone", key: "phone", width: 16 },
      { header: "Age", key: "age", width: 10 },
      { header: "Gender", key: "gender", width: 12 },
      { header: "Address", key: "address", width: 36 },
      { header: "Role", key: "role", width: 14 },
      { header: "Account Verified?", key: "accountVerified", width: 20 },
      { header: "Sign-In Method", key: "signInMethod", width: 18 },
      { header: "Total Registrations", key: "totalRegistrations", width: 20 },
      { header: "Payments Completed", key: "paymentsCompleted", width: 20 },
      { header: "Pending Payments", key: "pendingPayments", width: 18 },
      { header: "Receipts Available", key: "receiptsAvailable", width: 18 },
      { header: "Created At", key: "createdAt", width: 22 },
      { header: "Updated At", key: "updatedAt", width: 22 }
    ];

    exportUsers.forEach((user) => {
      const userRegistrations = registrationsByUser.get(user.id) || [];
      const paymentsCompleted = userRegistrations.filter((registration) =>
        ["Confirmed", "Pending Admin Approval", "Pending Admin Confirmation"].includes(registration.paymentStatus)
      ).length;

      sheet.addRow({
        userId: user.id || "",
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
        age: user.age || "",
        gender: user.gender || "",
        address: user.address || "",
        role: user.role || "user",
        accountVerified: user.isVerified ? "Yes" : "No",
        signInMethod: user.googleId ? "Google" : "Email/Password",
        totalRegistrations: userRegistrations.length,
        paymentsCompleted,
        pendingPayments: userRegistrations.filter((registration) => registration.paymentStatus === "Pending Payment").length,
        receiptsAvailable: userRegistrations.filter((registration) => registration.receiptUrl).length,
        createdAt: formatDateTime(user.createdAt),
        updatedAt: formatDateTime(user.updatedAt)
      });
    });

    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.autoFilter = "A1:P1";

    const headerRow = sheet.getRow(1);
    headerRow.height = 22;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0F766E" }
      };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: "FFD1D5DB" } },
        left: { style: "thin", color: { argb: "FFD1D5DB" } },
        bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
        right: { style: "thin", color: { argb: "FFD1D5DB" } }
      };
    });

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.height = 20;
      row.eachCell((cell) => {
        cell.alignment = { vertical: "middle", wrapText: true };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE5E7EB" } },
          left: { style: "thin", color: { argb: "FFE5E7EB" } },
          bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
          right: { style: "thin", color: { argb: "FFE5E7EB" } }
        };
      });
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=vaccination_users.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Users Excel export error:", error);
    res.status(500).json({ error: "Failed to export users Excel spreadsheet report." });
  }
});

app.listen(PORT, () => {
  console.log(`Vaccination drive server running at http://localhost:${PORT}`);
});
