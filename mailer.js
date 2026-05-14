const nodemailer = require('nodemailer');
require('dotenv').config();

// SMTP Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// Function to send alert email
async function sendStockAlert(product, brand, availableStock) {
  try {
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: 'jayalaksja24@gmail.com',
      subject: 'STOCK ALERT',
      text:
        `⚠️ STOCK ALERT ⚠️\n\n` +
        `Product: ${product}\n` +
        `Brand: ${brand}\n` +
        `Available Stock: ${availableStock} MT\n\n` +
        `IN NEED OF GOODS`
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent:', info.response);
    return true;

  } catch (error) {
    console.error('Error sending mail:', error.message);
    return false;
  }
}

module.exports = { sendStockAlert };