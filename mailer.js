
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

transporter.verify((err) => {
  if (err) {
    console.log("❌ Gmail verification failed:", err.message);
  } else {
    console.log("✅ Gmail transporter ready");
  }
});

async function sendStockAlert(product, brand, availableStock) {

  try {

    const info = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.ALERT_EMAIL || process.env.GMAIL_USER,
      subject: `⚠️ STOCK ALERT - ${brand}`,
      text: `
⚠️ STOCK ALERT ⚠️

Product: ${product}
Brand: ${brand}
Available Stock: ${availableStock}

Please restock immediately.
      `
    });

    console.log("✅ Alert email sent");
    console.log(info.response);

    return true;

  } catch (error) {

    console.error("❌ Error sending alert email:");
    console.error(error.message);

    return false;
  }
}

module.exports = { sendStockAlert };
