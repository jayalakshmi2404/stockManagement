
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================
// MONGODB CONNECTION
// ======================
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Atlas connected successfully"))
.catch((err) => console.error("❌ MongoDB Error:", err.message));

// ======================
// GMAIL TRANSPORT
// ======================
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.log("❌ Gmail verify failed:", error.message);
    } else {
        console.log("✅ Gmail ready (local testing)");
    }
});

// ======================
// STOCK SCHEMA
// ======================
const stockSchema = new mongoose.Schema({
    brand: String,
    companyName: String,
    sold: Number,
    unload: Number,
    previous: Number,
    current: Number,
    updatedBy: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Stock = mongoose.model("Stock", stockSchema);

// ======================
// HEALTH ROUTE
// ======================
app.get("/health", (req, res) => {
    res.json({
        success: true,
        message: "Server is running"
    });
});

// ======================
// UPDATE STOCK
// ======================
app.post("/updateStock", async (req, res) => {

    console.log("📦 UPDATE STOCK API CALLED");
    console.log("📩 BODY:", req.body);

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

        const currentQty = Number(current);

        if (!brand || isNaN(currentQty)) {
            return res.status(400).json({
                success: false,
                message: "Invalid stock data"
            });
        }

        // ======================
        // SAVE TO MONGODB
        // ======================
        const saved = await Stock.create({
            brand,
            companyName,
            sold: Number(sold || 0),
            unload: Number(unload || 0),
            previous: Number(previous || 0),
            current: currentQty,
            updatedBy
        });

        console.log("✅ Stock saved:", saved._id);

        // ======================
        // EMAIL CONTENT
        // ======================
        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: process.env.ALERT_EMAIL || process.env.GMAIL_USER,
            subject: `Stock Updated - ${brand}`,
            text: `
Brand: ${brand}
Company: ${companyName}
Previous: ${previous}
Sold: ${sold}
Unload: ${unload}
Current: ${current}
Updated By: ${updatedBy}
            `
        };

        console.log("📨 Sending mail to:", mailOptions.to);

        // ======================
        // SEND MAIL
        // ======================
        const info = await transporter.sendMail(mailOptions);

        console.log("✅ EMAIL SENT");
        console.log(info.response);

        return res.status(200).json({
            success: true,
            message: "Stock updated and email sent"
        });

    } catch (err) {

        console.error("❌ UPDATE ERROR:");
        console.error(err);

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

// ======================
// START SERVER
// ======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
