
require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

async function sendTestMail() {

  try {

    const info = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.ALERT_EMAIL || process.env.GMAIL_USER,
      subject: "✅ Inventory Test Email",
      text: "Inventory mail system is working correctly."
    });

    console.log("✅ TEST EMAIL SENT");
    console.log(info.response);

  } catch (err) {

    console.error("❌ TEST MAIL FAILED");
    console.error(err.message);
  }
}

sendTestMail();
