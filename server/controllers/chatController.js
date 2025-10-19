import { chat as chatService } from "../services/chatService.js"; // ✅ this must exist
import { ok } from "../utils/responses.js";

export const chat = async (req, res, next) => {
  try {
    const reply = await chatService(req.body);
    res.json(ok(reply));
  } catch (err) {
    console.error("Legacy movie chat error:", err);
    next(err);
  }
};
