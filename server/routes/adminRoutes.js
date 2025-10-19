import express from "express";
import {
  updateConfig,
  reindex,
  getUsers,
  getContent,
  getAnalytics,
  getLogs,
  getAllFeedback,
  getAdminStats
} from "../controllers/adminController.js";
import auth from "../middlewares/auth.js";
import authorizeRoles from "../middlewares/roleCheck.js";

const router = express.Router();

// =============================
// 🧩 Existing Admin-Protected Routes
// =============================

// ⚙ Update algorithm config (Admin only)
router.put(
  "/algorithm/config",
  auth,
  authorizeRoles("admin"),
  updateConfig
);

// 🔄 Reindex content (Admin only)
router.post(
  "/content/reindex",
  auth,
  authorizeRoles("admin"),
  reindex
);

// =============================
// 🧠 Dashboard Data Routes (Admin only)
// =============================

// 👥 Get list of users
router.get(
  "/users",
  auth,
  authorizeRoles("admin"),
  getUsers
);

// 🎬 Get content data
router.get(
  "/content",
  auth,
  authorizeRoles("admin"),
  getContent
);

// 📊 Get analytics data
router.get(
  "/analytics",
  auth,
  authorizeRoles("admin"),
  getAnalytics
);

// 🧾 Get system logs
router.get(
  "/logs",
  auth,
  authorizeRoles("admin"),
  getLogs
);

// 📨 Get all feedback
router.get(
  "/feedback",
  auth,
  authorizeRoles("admin"),
  getAllFeedback
);

// =============================
// 📈 Unified Stats Endpoint (Admin Dashboard)
// =============================
router.get(
  "/stats",
  auth,
  authorizeRoles("admin"),
  getAdminStats
);

export default router;
