
const nodemailer = require("nodemailer");
require("dotenv").config();

// ✅ FIXED TRANSPORTER (IMPORTANT)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "jayalaksja24@gmail.com",
    pass: process.env.GMAIL_APP_PASSWORD, // MUST be App Password
  },
});

// Email content
const mailOptions = {
  from: "jayalaksja24@gmail.com",
  to: "monisha33124@gmail.com",
  subject: "Test Mail",
  text: "This is a test email from Node.js",
};

// Send email
transporter.sendMail(mailOptions, (err, info) => {
  if (err) {
    console.error("❌ Email error:", err);
  } else {
    console.log("✅ Email sent:", info.response);
  }
});