require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const sgMail = require("@sendgrid/mail");

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
// SENDGRID SETUP
// ===============================
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
console.log("✅ SendGrid ready");

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
    // SAVE STOCK
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
    // SEND STOCK UPDATE EMAIL
    // ===============================
    const updateMail = {
      to: process.env.ALERT_EMAIL,
      from: process.env.GMAIL_USER,
      subject: `Stock Updated - ${brand}`,
      text: `
Stock Update Report
===================
Brand: ${brand}
Company: ${companyName}
Previous Stock: ${previous} MT
Sold: ${sold} MT
Unload: ${unload} MT
Current Stock: ${current} MT
Updated By: ${updatedBy}
      `
    };

    console.log("📨 Sending stock update email to:", process.env.ALERT_EMAIL);
    await sgMail.send(updateMail);
    console.log("✅ STOCK UPDATE EMAIL SENT");

    // ===============================
    // LOW STOCK ALERT
    // ===============================
    if (Number(current) < 5) {

      console.log("⚠️ LOW STOCK ALERT - Sending alert email...");

      const alertMail = {
        to: process.env.ALERT_EMAIL,
        from: process.env.GMAIL_USER,
        subject: `⚠️ LOW STOCK ALERT - ${brand}`,
        text: `
⚠️ LOW STOCK ALERT ⚠️
======================
Brand: ${brand}
Remaining Stock: ${current} MT

Please refill immediately!
        `
      };

      await sgMail.send(alertMail);
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