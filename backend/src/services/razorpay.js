const Razorpay = require("razorpay");

// Initialize Razorpay instance safely (won't crash if keys are missing initially)
let razorpayInstance = null;
try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
} catch (error) {
  console.warn("Razorpay configuration missing or invalid. Payments will not work.");
}

module.exports = razorpayInstance;
