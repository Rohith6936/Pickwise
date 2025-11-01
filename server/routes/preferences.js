import express from "express";
import User from "../models/User.js";

const router = express.Router();

// 🔹 Save or update preferences in User model
router.post("/:email/:type", async (req, res) => {
  const { email, type } = req.params;
  const { genres = [], era = "", favorites = [], languages = [], artists = [] } = req.body;

  try {
    console.log(`📩 Saving ${type} preferences for ${email}`);

    const prefPath = `preferences.${type}`;

    const user = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          [prefPath]: { genres, era, favorites, languages, artists },
        },
      },
      { new: true, upsert: true }
    );

    console.log(`✅ ${type} preferences saved for ${email}`);
    res.json({ success: true, data: user.preferences[type] });
  } catch (err) {
    console.error("❌ Error saving preferences:", err.message);
    res.status(500).json({ error: "Server error while saving preferences" });
  }
});

// 🔹 Get preferences for a specific type
router.get("/:email/:type", async (req, res) => {
  const { email, type } = req.params;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const prefs = user.preferences?.[type] || {};
    res.json({ success: true, data: prefs });
  } catch (err) {
    console.error("❌ Error fetching preferences:", err.message);
    res.status(500).json({ error: "Server error while fetching preferences" });
  }
});

export default router;
