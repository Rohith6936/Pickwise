import mongoose from "mongoose";

// ======================================================
// 🎯 Preference Schema — shared across categories
// ======================================================
const preferenceSchema = new mongoose.Schema({
  genres: { type: [String], default: [] },
  era: { type: String, default: "" },
  favorites: { type: [String], default: [] },

  // 🎵 Music-specific fields
  languages: { type: [String], default: [] },
  artists: { type: [String], default: [] },
});

// ======================================================
// 💾 Cached Recommendations Schema
// ======================================================
const cacheSchema = new mongoose.Schema({
  movies: { type: Array, default: [] },
  books: { type: Array, default: [] },
  music: { type: Array, default: [] },
  lastUpdated: { type: Date, default: null },
});

// ======================================================
// 👤 User Schema
// ======================================================
const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },

    // Role & account management
    role: { type: String, enum: ["user", "admin"], default: "user" },
    status: { type: String, enum: ["active", "inactive", "banned"], default: "active" },
    lastLogin: { type: Date },

    // 🎬📚🎵 Category-based preferences
    preferences: {
      movies: { type: preferenceSchema, default: {} },
      books: { type: preferenceSchema, default: {} },
      music: { type: preferenceSchema, default: {} },
    },

    // 🧠 AI-generated recommendations cache
    recommendationsCache: { type: cacheSchema, default: {} },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

export default mongoose.model("User", userSchema);
