// server/middlewares/auth.js
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev-secret";

/**
 * 🔐 Auth Middleware
 * - Extracts token from the "Authorization" header
 * - Verifies JWT token using SECRET
 * - Adds decoded user info to req.user
 */
const authMiddleware = (req, res, next) => {
  // 1️⃣ Get token from Authorization header ("Bearer <token>")
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  // 2️⃣ Verify token
  try {
    const decoded = jwt.verify(token, SECRET);

    // ✅ Attach decoded user info to request object
    req.user = {
      id: decoded.id,
      role: decoded.role || "user",
    };

    next(); // Continue to the next middleware or route
  } catch (err) {
    console.error("❌ Token verification failed:", err.message);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

export default authMiddleware;
