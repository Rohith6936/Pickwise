import express from "express";
import Preferences from "../models/preferences.js";

const router = express.Router();

// 🔹 Save or update preferences
router.post("/:email", async (req, res) => {
  const { email } = req.params;
  const { genres, era, favorites } = req.body;

  try {
    console.log("📩 Saving preferences for:", email);
    console.log("📦 Data received:", { genres, era, favorites });

    let prefs = await Preferences.findOne({ email });

    if (prefs) {
      prefs.genres = genres;
      prefs.era = era;
      prefs.favorites = favorites;
      await prefs.save();
      console.log("✅ Updated preferences for:", email);
    } else {
      prefs = new Preferences({ email, genres, era, favorites });
      await prefs.save();
      console.log("✅ Created preferences for:", email);
    }

    res.json({ success: true, data: prefs });
  } catch (err) {
    console.error("❌ Error saving preferences:", err.message);
    res.status(500).json({ error: "Server error while saving preferences" });
  }
});

// 🔹 Get preferences
router.get("/:email", async (req, res) => {
  const { email } = req.params;

  try {
    const prefs = await Preferences.findOne({ email });
    if (!prefs) {
      return res.status(404).json({ message: "Preferences not found" });
    }
    res.json({ success: true, data: prefs });
  } catch (err) {
    console.error("❌ Error fetching preferences:", err.message);
    res.status(500).json({ error: "Server error while fetching preferences" });
  }
});

export default router;
