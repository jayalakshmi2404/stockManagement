// =========================
// IMPORTS
// =========================
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
const path = require("path");

// =========================
// APP INIT
// =========================
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// =========================
// MONGODB ATLAS CONNECTION
// =========================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Atlas connected successfully"))
  .catch(err => console.error("❌ MongoDB Atlas connection error:", err));

// =========================
// EMAIL SETUP
// =========================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

transporter.verify((err) => {
  if (err) console.error("Email setup issue:", err.message);
  else console.log("✅ Email ready");
});

// =========================
// STOCK MODEL
// =========================
const Stock = mongoose.model("Stock", new mongoose.Schema({
  brand: String,
  companyName: String,
  sold: Number,
  unload: Number,
  previous: Number,
  current: Number,
  updatedBy: String,
  updatedAt: Date
}));

// =========================
// ROOT ROUTE
// =========================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// =========================
// UPDATE STOCK API
// =========================
app.post("/updateStock", async (req, res) => {
  try {
    const { brand, companyName, sold, unload, previous, current, updatedBy } = req.body;
    const currentStock = Number(current);

    await Stock.create({
      brand,
      companyName,
      sold,
      unload,
      previous,
      current: currentStock,
      updatedBy,
      updatedAt: new Date()
    });

    res.json({ success: true, message: "Stock updated successfully" });

    // General update email
    transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: "monisha33124@gmail.com",
      subject: `Stock Update - ${brand}`,
      text: `Brand: ${brand}\nCompany: ${companyName}\nCurrent Stock: ${currentStock}`
    });

    // Low stock alert
    if (currentStock < 5) {
      transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: "monisha33124@gmail.com",
        subject: `⚠️ Low Stock Alert - ${brand}`,
        text: `Stock for ${brand} (${companyName}) is critically low: ${currentStock} MT`
      });
    }

  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ success: false, message: "Update failed" });
  }
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("🚀 Server running on port", PORT));
