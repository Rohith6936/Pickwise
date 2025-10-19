import express from "express";
import {
  getRecommendations,
  getRecommendationsQuery,
  getCrossDomainRecommendations,
  getHistory,
  getRecommendationExplanation,
  getGlobalExplanations
} from "../controllers/recommendationsController.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

// ✅ 0️⃣ Query-based recommendations (supports explain=true)
router.get("/", auth, getRecommendationsQuery);

// ✅ 1️⃣ Cross-domain route (must come FIRST)
router.get("/cross/:email", auth, getCrossDomainRecommendations);

// ✅ 2️⃣ History route
router.get("/:email/history", auth, getHistory);

// ✅ 5️⃣ Global feature importances (place before dynamic param routes)
router.get("/global-explain", auth, getGlobalExplanations);

// ✅ 4️⃣ Per-item explanation (place BEFORE standard route to avoid shadowing)
router.get("/:id/explain", auth, getRecommendationExplanation);

// ✅ 3️⃣ Standard recommendations route
router.get("/:email/:type", auth, getRecommendations);

export default router;
