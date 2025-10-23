/* eslint-disable no-undef */
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
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
import contactRoutes from "./routes/contactRoutes.js"; // ✅ from first version
import { errorHandler } from "./middlewares/errorHandler.js";
import preferencesRoutes from "./routes/preferences.js";
// =====================================================
// ⚙️ INITIALIZATION
// =====================================================
dotenv.config();
const app = express();

// ✅ Attempt DB Connection (with graceful fallback)
try {
  await connectDB();
} catch (err) {
  console.warn("⚠ MongoDB connection failed:", err.message);
  console.warn("⚙ Running in demo mode without database");
}

// =====================================================
// ⚙️ CORS CONFIGURATION
// =====================================================
const allowedOrigins = [
  process.env.CLIENT_ORIGIN || "http://localhost:5173",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
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

// // =====================================================
// // 📧 EMAIL CONFIGURATION — Resend + SMTP (Auto-Fallback)
// // =====================================================
// let sendEmail;

// if (process.env.RESEND_API_KEY) {
//   const resend = new Resend(process.env.RESEND_API_KEY);
//   sendEmail = async (to, subject, text, html = null) => {
//     const fromAddress =
//       process.env.RESEND_FROM || "PickWise <onboarding@resend.dev>";
//     try {
//       await resend.emails.send({ from: fromAddress, to, subject, text, html });
//       console.log(`✅ Email sent via Resend to ${to}`);
//     } catch (err) {
//       console.error("❌ Resend email failed:", err?.message || err);
//       throw new Error("Resend email delivery failed");
//     }
//   };
//   console.log("📨 Email provider: Resend");
// }

// if (!sendEmail && process.env.SMTP_USER && process.env.SMTP_PASS) {
//   const transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST || "smtp.gmail.com",
//     port: Number(process.env.SMTP_PORT || 587),
//     secure: Number(process.env.SMTP_PORT || 587) === 465,
//     auth: {
//       user: process.env.SMTP_USER,
//       pass: process.env.SMTP_PASS,
//     },
//   });

//   transporter.verify((err, success) => {
//     if (err) {
//       console.error("⚠ SMTP connection failed:", err.message);
//     } else {
//       console.log("✅ SMTP transporter ready");
//     }
//   });

//   sendEmail = async (to, subject, text, html = null) => {
//     try {
//       await transporter.sendMail({
//         from: process.env.SMTP_USER,
//         to,
//         subject,
//         text,
//         html,
//       });
//       console.log(`✅ Email sent via SMTP to ${to}`);
//     } catch (err) {
//       console.error("❌ SMTP email failed:", err.message);
//       throw new Error("SMTP email delivery failed");
//     }
//   };
//   console.log("📨 Email provider: SMTP");
// }

// if (!sendEmail) {
//   console.warn(
//     "⚠ No email provider configured. Set either RESEND_API_KEY or SMTP_USER/SMTP_PASS."
//   );
//   sendEmail = async () => {
//     throw new Error("Email service not configured");
//   };
// }

// =====================================================
// 📧 EMAIL CONFIGURATION — SendGrid (API-based)
// =====================================================
import fetch from "node-fetch";

let sendEmail;

if (process.env.SENDGRID_API_KEY) {
  sendEmail = async (to, subject, text, html = null) => {
    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }], subject }],
          from: {
            email: process.env.SENDGRID_FROM || "pickwise520@gmail.com",
            name: "PickWise System",
          },
          content: [
            {
              type: html ? "text/html" : "text/plain",
              value: html || text,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ SendGrid send failed:", errorText);
        throw new Error(`SendGrid Error: ${response.statusText}`);
      }

      console.log(`✅ Email sent via SendGrid to ${to}`);
    } catch (err) {
      console.error("❌ SendGrid email error:", err.message);
      throw new Error("SendGrid email delivery failed");
    }
  };

  console.log("📨 Email provider: SendGrid");
} else {
  console.warn("⚠ No SendGrid API key found. Email service disabled.");
  sendEmail = async () => {
    throw new Error("SendGrid not configured");
  };
}

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
    res.json({ ok: true, message: "OTP sent to email" });
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
app.use("/api/contact", contactRoutes); // ✅ retained
app.use("/api/preferences", preferencesRoutes); 

// ===== Error Handling Middleware =====
app.use(errorHandler);

// =====================================================
// 🌍 HEALTH CHECK ENDPOINT (important for Render)
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
