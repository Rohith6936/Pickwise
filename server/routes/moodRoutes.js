import express from "express";
import { getMoviesByMood } from "../controllers/moodController.js";

const router = express.Router();

// 🎬 Get movies based on mood
router.get("/:genre", getMoviesByMood);

export default router;
