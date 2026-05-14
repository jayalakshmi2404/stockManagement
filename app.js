const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

app.use(express.json());

/* ================= MONGODB (FIXED FOR RENDER) ================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB error:', err));

/* ================= SCHEMAS ================= */
const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  role: String
}));

const Login = mongoose.model('Login', new mongoose.Schema({
  username: String,
  role: String,
  time: { type: Date, default: Date.now }
}));

const Stock = mongoose.model('Stock', new mongoose.Schema({
  itemName: String,
  quantity: Number
}));

/* ================= EMAIL ================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

/* ================= ROUTES ================= */

app.post('/login-track', async (req, res) => {
  try {
    const login = new Login(req.body);
    await login.save();
    res.json({ message: "Login tracked" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/add-stock', async (req, res) => {
  try {
    const stock = new Stock(req.body);
    await stock.save();
    res.json({ message: "Stock added" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= LOW STOCK EMAIL ================= */
app.get('/check-stock', async (req, res) => {
  try {
    const low = await Stock.find({ quantity: { $lt: 5 } });

    if (low.length > 0) {
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: process.env.GMAIL_USER,
        subject: "Low Stock Alert",
        text: JSON.stringify(low)
      });

      return res.json({ message: "Email sent", low });
    }

    res.json({ message: "Stock OK" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= SERVER ================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});