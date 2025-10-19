// server/models/Mood.js
import mongoose from "mongoose";

const moodSchema = new mongoose.Schema({
  email: { type: String, required: true },
  mood: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Mood", moodSchema);
