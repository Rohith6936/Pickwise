import express from "express";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import ContactMessage from "../models/ContactMessage.js";
import * as ContactSvc from "../services/contactService.js";

const router = express.Router();

function buildTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });
}

router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const ready = mongoose.connection?.readyState;
    let doc;
    if (ready === 1) {
      doc = await ContactMessage.create({ name, email, message });
    } else {
      // Fallback to in-memory store
      doc = ContactSvc.addMemoryMessage({ name, email, message });
    }

    const id = doc?._id || doc?.id;
    res.status(201).json({ success: true, data: { id } });

    // Fire-and-forget emails after responding
    setImmediate(async () => {
      try {
        const adminEmail = process.env.CONTACT_ADMIN_EMAIL || process.env.SMTP_USER;
        if (adminEmail) {
          const transporter = buildTransporter();
          await transporter.sendMail({
            from: process.env.SMTP_USER || adminEmail,
            to: adminEmail,
            subject: "New Contact Message",
            text: `From: ${name} <${email}>\n\n${message}`,
          });
        }
      } catch (err) {
        console.error("❌ Failed to send admin email:", err.message);
      }

      try {
        if (process.env.SMTP_USER) {
          const transporter = buildTransporter();
          await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject: "We received your message",
            text: "Thanks for contacting us. Our team will get back to you soon.",
          });
        }
      } catch (err) {
        console.error("❌ Failed to send user confirmation email:", err.message);
      }
    });
  } catch (err) {
    console.error("❌ Contact route error:", err);
    return res.status(500).json({ success: false, message: "Failed to submit message" });
  }
});

// Dev-only: list all contact messages without auth when ALLOW_DEV_ADMIN=true
router.get("/admin-list", async (req, res) => {
  try {
    if (process.env.ALLOW_DEV_ADMIN !== "true") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const ready = mongoose.connection?.readyState;
    if (ready === 1) {
      const docs = await ContactMessage.find({}).sort({ createdAt: -1 }).lean();
      return res.json({ success: true, data: docs });
    }

    const mem = ContactSvc.listMemoryMessages();
    return res.json({ success: true, data: mem });
  } catch (err) {
    console.error("❌ Failed to load contact messages:", err);
    return res.status(500).json({ success: false, message: "Failed to load contact messages" });
  }
});

export default router;
