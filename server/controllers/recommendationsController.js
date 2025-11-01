// ===============================================================
// 📦 Imports & Setup
// ===============================================================
import Recommendation from "../models/Recommendation.js";
import User from "../models/User.js";
import {
  getRecommendations as getRecommendationsService,
  getCrossDomainRecommendations as getCrossDomainRecommendationsService,
} from "../services/recommendationsService.js";
import {
  getAIRecommendationsWithExplanations,
  getGlobalFeatureImportances,
} from "../services/aiRecommenderService.js";

// Helper: generate a simple stable ID from title/type if no ID present
function slugifyId(item, type) {
  if (item.id || item._id) return String(item.id || item._id);
  const base = `${type || "item"}-${item.title || item.name || "untitled"}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base || `${type}-unknown`;
}

async function getUserPrefs(email) {
  const user = await User.findOne({ email });
  return user?.preferences || {};
}

// ===============================================================
// 🎯 1️⃣ Fetch Single-Domain Recommendations (Movies, Books, Music)
// ===============================================================
import _ from "lodash"; // 🆕 Add this at the top of the file

export const getRecommendations = async (req, res) => {
  try {
    const { email, type } = req.params;
    const { explain, force } = req.query; // 🆕 Added force flag
    console.log(`📩 Request received for: ${email}, Type: ${type}, Force: ${force}`);

    if (!email || !type) {
      return res.status(400).json({
        success: false,
        message: "Missing email or type parameter.",
      });
    }

    if (!["movies", "books", "music"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recommendation type.",
      });
    }

    // 1️⃣ Fetch the current user preferences
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const currentPrefs = user.preferences || {};
    console.log("🧩 Current Preferences:", JSON.stringify(currentPrefs, null, 2));

    // 2️⃣ Check for existing recommendation in DB
    const existing = await Recommendation.findOne({ email, type }).sort({ createdAt: -1 });

    // 🆕 Handle Force Refresh
    if (String(force).toLowerCase() === "true") {
      console.log("🔁 Force refresh → Ignoring cache and regenerating recommendations...");
    } else if (existing) {
      const prevPrefs = existing.preferencesSnapshot || {};
      console.log("📜 Previous Snapshot:", JSON.stringify(prevPrefs, null, 2));

      const prefsChanged = !_.isEqual(prevPrefs, currentPrefs); // 🧠 Deep compare

      console.log("🧮 Preferences Changed?:", prefsChanged);

      if (!prefsChanged) {
        console.log("✅ Preferences unchanged → Returning cached recommendations");
        return res.status(200).json({
          success: true,
          recommendations: existing.items || [],
          source: "cache",
          message: `✅ Cached ${type} recommendations fetched successfully`,
        });
      } else {
        console.log("⚠️ Preferences changed → Regenerating recommendations...");
      }
    } else {
      console.log("💾 No previous recommendations found → Generating new ones...");
    }

    // 3️⃣ Generate new recommendations using your service
    const data = await getRecommendationsService(email, type);

    if (!data || data.length === 0) {
      console.warn(`⚠️ No ${type} recommendations found for ${email}`);
      return res.status(200).json({
        success: true,
        recommendations: [],
        message: `⚠️ No ${type} recommendations found.`,
      });
    }

    // 4️⃣ If explain=true, enrich with XAI
    const withIds = data.map((it) => ({ ...it, id: slugifyId(it, type) }));
    let finalData = withIds;

    if (String(explain).toLowerCase() === "true") {
      const enriched = await getAIRecommendationsWithExplanations(currentPrefs, withIds, type);
      finalData = enriched.map((it) => ({ ...it, id: slugifyId(it, type) }));
      console.log(`💡 Generated XAI explanations for ${type}`);
    }

    // 5️⃣ Save new recommendations + preference snapshot
    await Recommendation.create({
      email,
      type,
      items: finalData,
      preferencesSnapshot: currentPrefs, // ✅ Ensures we compare next time
      createdAt: new Date(),
    });

    console.log(`✅ New ${type} recommendations saved for ${email}`);

    // 6️⃣ Respond to client
    res.status(200).json({
      success: true,
      recommendations: finalData,
      source: force ? "forced-refresh" : "new",
      message: `✅ ${type} recommendations generated successfully`,
    });
  } catch (err) {
    console.error("❌ Controller Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Error fetching recommendations",
    });
  }
};

// ===============================================================
// 🔍 1.1 Query-based recommendations: GET /api/recommendations?email=...&type=movies&explain=true
// ===============================================================
export const getRecommendationsQuery = async (req, res) => {
  try {
    const { email, type = "movies", explain, force } = req.query; // added force param here too
    if (!email) {
      return res.status(400).json({ success: false, message: "Missing email" });
    }
    if (!["movies", "books", "music"].includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid type" });
    }
    // Delegate to existing handler
    req.params = { email, type };
    req.query = { explain, force };
    return getRecommendations(req, res);
  } catch (err) {
    console.error("❌ Query-based recommendations error:", err.message);
    res.status(500).json({ success: false, message: "Error" });
  }
};

// ===============================================================
// 🌍 2️⃣ Fetch Cross-Domain Recommendations (User Input or Preference)
// ===============================================================
export const getCrossDomainRecommendations = async (req, res) => {
  try {
    const { email } = req.params;
    const { base, query } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Missing email parameter.",
      });
    }

    let source = "";
    if (query) {
      source = `User Input: "${query}"`;
    } else if (base) {
      source = `Base Preference: "${base}"`;
    } else {
      return res.status(400).json({
        success: false,
        message: "Provide either a 'query' or 'base' parameter.",
      });
    }

    console.log(`🌍 Cross-domain request for ${email} | ${source}`);

    const result = await getCrossDomainRecommendationsService(email, query || base);

    if (!result || !result.recommendations) {
      return res.status(200).json({
        success: true,
        recommendations: {},
        message: "⚠️ No cross-domain recommendations found.",
      });
    }

    await Recommendation.create({
      email,
      type: query ? `cross-query` : `cross-${base}`,
      items: result.recommendations,
      createdAt: new Date(),
    });

    console.log(`✅ Cross-domain recommendations generated for ${email}`);

    res.status(200).json({
      success: true,
      ...result,
      message: `✅ Cross-domain recommendations fetched successfully based on ${query ? "your input" : "preferences"}`,
    });
  } catch (err) {
    console.error("❌ Cross-domain Controller Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Error fetching cross-domain recommendations",
    });
  }
};

// ===============================================================
// 📜 3️⃣ Fetch User Recommendation History
// ===============================================================
export const getHistory = async (req, res) => {
  try {
    const { email } = req.params;
    console.log("📩 Fetching history for:", email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email parameter missing.",
      });
    }

    const history = await Recommendation.find({ email })
      .sort({ createdAt: -1 })
      .limit(5);

    if (!history.length) {
      return res.status(200).json({
        success: true,
        history: [],
        message: "No recommendation history found.",
      });
    }

    res.status(200).json({
      success: true,
      history,
      message: "✅ History fetched successfully",
    });
  } catch (err) {
    console.error("❌ History fetch error:", err.message);
    res.status(500).json({
      success: false,
      message: "Error fetching history",
    });
  }
};

// ===============================================================
// 🧠 4️⃣ Per-recommendation Explanation
// ===============================================================
export const getRecommendationExplanation = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, type = "movies" } = req.query;
    if (!email || !id) {
      return res.status(400).json({ success: false, message: "Missing email or id" });
    }
    if (!["movies", "books", "music"].includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid type" });
    }

    let found = null;
    try {
      const latest = await Recommendation.findOne({ email, type }).sort({ createdAt: -1 });
      if (latest && Array.isArray(latest.items)) {
        found = latest.items.find((x) => String(x.id) === String(id));
      }
    } catch (dbErr) {}

    if (!found) {
      const items = await getRecommendationsService(email, type);
      const withIds = (items || []).map((it) => ({ ...it, id: slugifyId(it, type) }));
      found = withIds.find((x) => String(x.id) === String(id));
      if (!found) {
        return res.status(404).json({ success: false, message: "Item not found in recommendations" });
      }
    }

    const prefs = await getUserPrefs(email);
    const [enriched] = await getAIRecommendationsWithExplanations(prefs, [found], type);
    return res.status(200).json({ success: true, id, explanation: enriched.explanation, score: enriched.score });
  } catch (err) {
    console.error("❌ Single explanation error:", err.message);
    res.status(500).json({ success: false, message: "Error generating explanation" });
  }
};

// ===============================================================
// 🌐 5️⃣ Global Feature Importances
// ===============================================================
export const getGlobalExplanations = async (req, res) => {
  try {
    const { type = "movies" } = req.query;
    if (!["movies", "books", "music"].includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid type" });
    }
    const result = await getGlobalFeatureImportances([], type);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error("❌ Global explain error:", err.message);
    res.status(500).json({ success: false, message: "Error computing global explanations" });
  }
};
