/* eslint-disable no-undef */
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import { connectDB } from "./config/db.js";

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
// ⚙️ CORS CONFIGURATION (Render + Localhost)
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
// 📧 EMAIL CONFIGURATION — SMTP (Primary) + Resend (Fallback)
// =====================================================
let sendEmail;

// --- Primary: Gmail SMTP ---
let smtpTransporter = null;
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  smtpTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  smtpTransporter.verify((err) => {
    if (err) console.error("⚠ SMTP connection failed:", err.message);
    else console.log("✅ SMTP transporter ready");
  });
}

// --- Fallback: Resend ---
const resend =
  process.env.RESEND_API_KEY && new Resend(process.env.RESEND_API_KEY);

// --- Smart Send Function ---
sendEmail = async (to, subject, text, html = null) => {
  // 1️⃣ Try SMTP first
  if (smtpTransporter) {
    try {
      await smtpTransporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject,
        text,
        html,
      });
      console.log(`✅ Email sent via SMTP to ${to}`);
      return;
    } catch (err) {
      console.warn("⚠ SMTP failed:", err.message);
    }
  }

  // 2️⃣ Try Resend fallback
  if (resend) {
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM || "PickWise <onboarding@resend.dev>",
        to,
        subject,
        text,
        html,
      });
      console.log(`✅ Email sent via Resend fallback to ${to}`);
      return;
    } catch (err) {
      console.error("❌ Resend fallback failed:", err.message);
    }
  }

  // 3️⃣ If both fail
  throw new Error("Email delivery failed via both SMTP and Resend.");
};

// =====================================================
// 🔐 OTP MANAGEMENT
// =====================================================
const OTP_EXPIRY_SECONDS = Number(process.env.OTP_EXPIRY_SECONDS || 300);
const otpStore = new Map();

function generateOtp(digits = 6) {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return String(Math.floor(Math.random() * (max - min + 1) + min));
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

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color:#4f46e5;">🔐 PickWise Verification</h2>
        <p>Your OTP is:</p>
        <h1 style="color:#1e293b; letter-spacing: 2px;">${otp}</h1>
        <p>This code will expire in <b>${Math.floor(
          OTP_EXPIRY_SECONDS / 60
        )} minutes</b>.</p>
        <p style="color:#6b7280; font-size: 0.9rem;">
          If you didn’t request this, please ignore this email.
        </p>
      </div>
    `;

    await sendEmail(
      email,
      "Your PickWise Signup OTP",
      `Your OTP is: ${otp}. It expires in ${Math.floor(
        OTP_EXPIRY_SECONDS / 60
      )} minutes.`,
      html
    );

    console.log(`✅ OTP sent to ${email}: ${otp}`);
    res.json({ ok: true, message: "OTP sent successfully" });
  } catch (err) {
    console.error("❌ send-otp error:", err.message);
    res.status(500).json({ error: "Failed to send OTP" });
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
  res.json({ ok: true, message: "OTP verified" });
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
// 🌍 HEALTH CHECK (Required by Render)
// =====================================================
app.get("/", (req, res) => {
  res.send("✅ PickWise Backend is running successfully");
});

// =====================================================
// 🚀 SERVER LISTENER
// =====================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Allowed origins: ${allowedOrigins.join(", ")}`);
});
