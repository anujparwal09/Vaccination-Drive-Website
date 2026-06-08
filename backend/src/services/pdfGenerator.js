const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const RECEIPTS_DIR = path.resolve(process.env.DATA_DIR || path.resolve(__dirname, "../.."), "receipts");

if (!fs.existsSync(RECEIPTS_DIR)) {
  fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
}

const getReceiptFileName = (registrationId) => `receipt-${registrationId}.pdf`;
const getReceiptFilePath = (registrationId) => path.join(RECEIPTS_DIR, getReceiptFileName(registrationId));
const getReceiptUrl = (registrationId) => `/receipt/${registrationId}`;

const generateReceipt = async (paymentData, registrationData, userData) => {
  return new Promise((resolve, reject) => {
    try {
      const fileName = getReceiptFileName(registrationData.id);
      const filePath = getReceiptFilePath(registrationData.id);
      const paymentDate = paymentData.createdAt || new Date().toISOString();

      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("Rotaract Club of Osmania Medical College", { align: "center" })
        .moveDown(0.5);

      doc
        .fontSize(14)
        .font("Helvetica")
        .text("Vaccination Drive Receipt", { align: "center" })
        .moveDown(2);

      // Details Box
      doc.rect(50, doc.y, 500, 230).stroke();
      doc.moveDown(1);

      const startY = doc.y;
      const leftCol = 70;
      const rightCol = 250;

      doc.fontSize(12).font("Helvetica-Bold").text("Registration ID:", leftCol, startY);
      doc.font("Helvetica").text(registrationData.id, rightCol, startY);

      doc.font("Helvetica-Bold").text("Payment ID:", leftCol, startY + 20);
      doc.font("Helvetica").text(paymentData.paymentId, rightCol, startY + 20);

      doc.font("Helvetica-Bold").text("Name:", leftCol, startY + 40);
      doc.font("Helvetica").text(userData.fullName || registrationData.fullName, rightCol, startY + 40);

      doc.font("Helvetica-Bold").text("Vaccine:", leftCol, startY + 60);
      doc.font("Helvetica").text(registrationData.vaccineName, rightCol, startY + 60);

      doc.font("Helvetica-Bold").text("Dose:", leftCol, startY + 80);
      doc.font("Helvetica").text(registrationData.dose, rightCol, startY + 80);

      doc.font("Helvetica-Bold").text("Amount:", leftCol, startY + 100);
      doc.font("Helvetica").text(`Rs. ${paymentData.amount}`, rightCol, startY + 100);

      doc.font("Helvetica-Bold").text("Payment Date:", leftCol, startY + 120);
      doc.font("Helvetica").text(new Date(paymentDate).toLocaleString("en-IN"), rightCol, startY + 120);

      doc.font("Helvetica-Bold").text("Payment Status:", leftCol, startY + 140);
      doc.fillColor("green").text(paymentData.status || registrationData.paymentStatus || "Success", rightCol, startY + 140).fillColor("black");

      doc.font("Helvetica-Bold").text("Organization Name:", leftCol, startY + 160);
      doc.font("Helvetica").text("Rotaract Club of Osmania Medical College", rightCol, startY + 160, { width: 260 });

      doc.moveDown(4);
      
      // Footer
      doc
        .fontSize(10)
        .font("Helvetica-Oblique")
        .text("This is an automatically generated receipt. Present this receipt with your registration ID at the vaccination center.", 50, doc.y + 50, { align: "center", width: 500 });

      doc.end();

      stream.on("finish", () => {
        resolve({
          fileName,
          filePath,
          receiptUrl: getReceiptUrl(registrationData.id),
        });
      });

      stream.on("error", (err) => {
        reject(err);
      });

    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  RECEIPTS_DIR,
  generateReceipt,
  getReceiptFileName,
  getReceiptFilePath,
  getReceiptUrl,
};
