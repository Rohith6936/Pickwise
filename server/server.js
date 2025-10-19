/* eslint-disable no-undef */
import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js"; // ✅ DB connection

// =====================================================
// 🧩 ROUTE IMPORTS
// =====================================================
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/userRoutes.js";
import recommendationRoutes from "./routes/recommendations.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import moodRoutes from "./routes/moodRoutes.js";
import groupSyncRoutes from "./routes/groupsyncRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import tmdbRoutes from "./routes/tmdbRoutes.js";
import spotifyRoutes from "./routes/spotifyRoutes.js";
import booksRouter from "./routes/books.js";
import { errorHandler } from "./middlewares/errorHandler.js";

// =====================================================
// ⚙️ INITIALIZATION
// =====================================================
dotenv.config();
const app = express();

// ✅ Connect to MongoDB
await connectDB();

// =====================================================
// ⚙️ CORS CONFIGURATION (✅ Updated for Render)
// =====================================================
const allowedOrigins = [
  "http://localhost:5173",
  "https://personalised-recommendations-1.onrender.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("🚫 CORS blocked request from:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// 🪵 Request Logger
app.use((req, res, next) => {
  console.log(`📩 ${req.method} ${req.url}`);
  next();
});

// =====================================================
// 📧 OTP SUPPORT — Email Verification
// =====================================================
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const OTP_EXPIRY_SECONDS = process.env.OTP_EXPIRY_SECONDS
  ? Number(process.env.OTP_EXPIRY_SECONDS)
  : 300;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

const otpStore = new Map();

function generateOtp(digits = 6) {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return String(Math.floor(Math.random() * (max - min + 1) + min));
}

async function sendMail(to, subject, text) {
  try {
    await transporter.sendMail({ from: SMTP_USER, to, subject, text });
  } catch (err) {
    console.error("❌ Email send failed:", err.message);
    throw new Error("Email delivery failed");
  }
}

// ===== Send OTP =====
app.post("/api/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    const otp = generateOtp(6);
    const expiresAt = Date.now() + OTP_EXPIRY_SECONDS * 1000;

    if (otpStore.has(email)) clearTimeout(otpStore.get(email).timeoutHandle);

    const timeoutHandle = setTimeout(
      () => otpStore.delete(email),
      OTP_EXPIRY_SECONDS * 1000
    );

    otpStore.set(email, { otp, expiresAt, timeoutHandle });

    await sendMail(
      email,
      "Your Signup OTP",
      `Your OTP is: ${otp}\n\nThis code will expire in ${Math.floor(
        OTP_EXPIRY_SECONDS / 60
      )} minutes.\n\nIf you did not request this, please ignore this email.`
    );

    console.log(`✅ OTP sent to ${email}: ${otp}`);
    return res.json({ ok: true, message: "OTP sent to email" });
  } catch (err) {
    console.error("❌ send-otp error:", err);
    return res.status(500).json({ error: "Failed to send OTP" });
  }
});

// ===== Verify OTP =====
app.post("/api/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res.status(400).json({ error: "Email and OTP required" });

  const record = otpStore.get(email);
  if (!record)
    return res
      .status(400)
      .json({ ok: false, error: "No OTP requested or OTP expired" });

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ ok: false, error: "OTP expired" });
  }

  if (record.otp !== String(otp).trim())
    return res.status(400).json({ ok: false, error: "Invalid OTP" });

  clearTimeout(record.timeoutHandle);
  otpStore.delete(email);

  console.log(`✅ OTP verified for ${email}`);
  return res.json({ ok: true, message: "OTP verified" });
});

// =====================================================
// 🌐 API ROUTES
// =====================================================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/mood", moodRoutes);
app.use("/api/groupsync", groupSyncRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/tmdb", tmdbRoutes);
app.use("/api/spotify", spotifyRoutes);
app.use("/api/books", booksRouter);

// ===== Error Handling Middleware =====
app.use(errorHandler);

// =====================================================
// 🚀 SERVER LISTENER
// =====================================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🎥 TMDB Provider API enabled`);
  console.log(
    `🌍 Frontend origins allowed: ${allowedOrigins.join(", ")}`
  );
});
