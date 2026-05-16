require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const axios = require("axios");

const app = express();

// ===============================
// MIDDLEWARE
// ===============================
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===============================
// SERVE FRONTEND FILES
// ===============================
app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ===============================
// MONGODB CONNECTION
// ===============================
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log("✅ MongoDB connected successfully");
})
.catch((err) => {
  console.error("❌ MongoDB error:", err.message);
});

// ===============================
// BREVO EMAIL FUNCTION (HTTP API)
// Works on Railway, Render, Heroku
// and ALL cloud platforms perfectly
// ===============================
async function sendEmail(to, subject, textContent, htmlContent) {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Stock Management",
          email: process.env.BREVO_SENDER_EMAIL  // jayalaksja24@gmail.com
        },
        to: [{ email: to }],
        subject: subject,
        textContent: textContent,
        htmlContent: htmlContent
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );
    console.log("✅ Email sent successfully | MessageId:", response.data.messageId);
    return true;
  } catch (err) {
    console.error("❌ Brevo Email Error:", err.response?.data || err.message);
    throw new Error(err.response?.data?.message || "Email sending failed");
  }
}

console.log("✅ Brevo HTTP API ready");

// ===============================
// STOCK SCHEMA
// ===============================
const stockSchema = new mongoose.Schema({
  brand: String,
  companyName: String,
  sold: Number,
  unload: Number,
  previous: Number,
  current: Number,
  updatedBy: String,
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Stock = mongoose.model("Stock", stockSchema);

// ===============================
// HEALTH ROUTE
// ===============================
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server running successfully"
  });
});

// ===============================
// UPDATE STOCK API
// ===============================
app.post("/updateStock", async (req, res) => {

  console.log("📦 UPDATE STOCK API CALLED");
  console.log("📩 BODY RECEIVED:", req.body);

  try {

    const {
      brand,
      companyName,
      sold,
      unload,
      previous,
      current,
      updatedBy
    } = req.body;

    // ===============================
    // VALIDATION
    // ===============================
    if (!brand || current === undefined) {
      console.log("❌ Invalid request");
      return res.status(400).json({
        success: false,
        message: "Invalid stock data"
      });
    }

    // ===============================
    // SAVE STOCK TO MONGODB
    // ===============================
    const stock = await Stock.create({
      brand: brand,
      companyName: companyName || "",
      sold: Number(sold || 0),
      unload: Number(unload || 0),
      previous: Number(previous || 0),
      current: Number(current || 0),
      updatedBy: updatedBy || "Admin",
      updatedAt: new Date()
    });

    console.log("✅ Stock saved:", stock._id);

    // ===============================
    // STOCK UPDATE EMAIL - TEXT
    // ===============================
    const updateText = `
Stock Update Report
===================
Brand          : ${brand}
Company        : ${companyName || "N/A"}
Previous Stock : ${previous} MT
Sold           : ${sold} MT
Unload         : ${unload} MT
Current Stock  : ${current} MT
Updated By     : ${updatedBy || "Admin"}
Updated At     : ${new Date().toLocaleString()}
    `;

    // ===============================
    // STOCK UPDATE EMAIL - HTML
    // ===============================
    const updateHTML = `
      <div style="font-family:Arial; max-width:600px; margin:auto; border:1px solid #ddd; border-radius:8px; overflow:hidden;">
        <div style="background:#2E75B6; padding:20px; text-align:center;">
          <h2 style="color:white; margin:0;">📦 Stock Update Report</h2>
        </div>
        <div style="padding:20px;">
          <table style="width:100%; border-collapse:collapse;">
            <tr style="background:#f2f2f2;">
              <td style="padding:10px; border:1px solid #ddd; font-weight:bold; width:40%;">Brand</td>
              <td style="padding:10px; border:1px solid #ddd;">${brand}</td>
            </tr>
            <tr>
              <td style="padding:10px; border:1px solid #ddd; font-weight:bold;">Company</td>
              <td style="padding:10px; border:1px solid #ddd;">${companyName || "N/A"}</td>
            </tr>
            <tr style="background:#f2f2f2;">
              <td style="padding:10px; border:1px solid #ddd; font-weight:bold;">Previous Stock</td>
              <td style="padding:10px; border:1px solid #ddd;">${previous} MT</td>
            </tr>
            <tr>
              <td style="padding:10px; border:1px solid #ddd; font-weight:bold;">Sold</td>
              <td style="padding:10px; border:1px solid #ddd;">${sold} MT</td>
            </tr>
            <tr style="background:#f2f2f2;">
              <td style="padding:10px; border:1px solid #ddd; font-weight:bold;">Unload</td>
              <td style="padding:10px; border:1px solid #ddd;">${unload} MT</td>
            </tr>
            <tr>
              <td style="padding:10px; border:1px solid #ddd; font-weight:bold;">Current Stock</td>
              <td style="padding:10px; border:1px solid #ddd;">
                <b style="color:green; font-size:16px;">${current} MT</b>
              </td>
            </tr>
            <tr style="background:#f2f2f2;">
              <td style="padding:10px; border:1px solid #ddd; font-weight:bold;">Updated By</td>
              <td style="padding:10px; border:1px solid #ddd;">${updatedBy || "Admin"}</td>
            </tr>
            <tr>
              <td style="padding:10px; border:1px solid #ddd; font-weight:bold;">Updated At</td>
              <td style="padding:10px; border:1px solid #ddd;">${new Date().toLocaleString()}</td>
            </tr>
          </table>
        </div>
        <div style="background:#f9f9f9; padding:10px; text-align:center; color:#888; font-size:12px;">
          Stock Management System
        </div>
      </div>
    `;

    // ===============================
    // SEND STOCK UPDATE EMAIL
    // ===============================
    console.log("📨 Sending stock update email to:", process.env.ALERT_EMAIL);
    await sendEmail(
      process.env.ALERT_EMAIL,
      `Stock Updated - ${brand}`,
      updateText,
      updateHTML
    );
    console.log("✅ STOCK UPDATE EMAIL SENT");

    // ===============================
    // LOW STOCK ALERT EMAIL
    // ===============================
    if (Number(current) < 5) {

      console.log("⚠️ LOW STOCK ALERT - Sending alert email...");

      const alertText = `
⚠️ LOW STOCK ALERT ⚠️
======================
Brand           : ${brand}
Remaining Stock : ${current} MT

Please refill immediately!
      `;

      const alertHTML = `
        <div style="font-family:Arial; max-width:600px; margin:auto; border:2px solid red; border-radius:8px; overflow:hidden;">
          <div style="background:red; padding:20px; text-align:center;">
            <h2 style="color:white; margin:0;">⚠️ LOW STOCK ALERT</h2>
          </div>
          <div style="padding:30px; text-align:center;">
            <p style="font-size:18px;"><b>Brand:</b> ${brand}</p>
            <p style="font-size:28px; color:red; font-weight:bold;">
              Only ${current} MT Remaining!
            </p>
            <p style="font-size:16px; color:#555;">Please refill stock immediately!</p>
          </div>
          <div style="background:#f9f9f9; padding:10px; text-align:center; color:#888; font-size:12px;">
            Stock Management System
          </div>
        </div>
      `;

      await sendEmail(
        process.env.ALERT_EMAIL,
        `⚠️ LOW STOCK ALERT - ${brand}`,
        alertText,
        alertHTML
      );
      console.log("⚠️ LOW STOCK EMAIL SENT");
    }

    // ===============================
    // SUCCESS RESPONSE
    // ===============================
    return res.status(200).json({
      success: true,
      message: "Stock updated and email sent successfully"
    });

  } catch (err) {

    console.error("❌ UPDATE STOCK ERROR:", err.message);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});