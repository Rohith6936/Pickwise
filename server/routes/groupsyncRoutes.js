import express from "express";
import { createGroup, getGroup } from "../controllers/groupsyncController.js";

const router = express.Router();

// 👥 Create a new group
router.post("/", createGroup);

// 📋 Get details of a specific group
router.get("/:sessionId", getGroup);

export default router;
