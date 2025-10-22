// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

/**
 * ✅ Safely decode JWT payload (without external libraries)
 */
function decodeJwtPayload(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * 🔐 ProtectedRoute ensures that:
 *  - A valid JWT token exists
 *  - Token is not expired
 *  - User has the required role (if specified)
 */
function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem("token");

  // ❌ No token = redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 🧩 Decode token payload
  const payload = decodeJwtPayload(token);
  const expMs = payload?.exp ? payload.exp * 1000 : null;

  // ⏰ Check expiration
  if (!payload || (expMs && Date.now() >= expMs)) {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch (err) {
      console.warn("Failed to clear token:", err);
    }
    return <Navigate to="/login" replace />;
  }

  // 🧠 Check required role (e.g., admin)
  if (requiredRole) {
    const userRole = payload?.role;
    if (!userRole || userRole !== requiredRole) {
      return <Navigate to="/" replace />;
    }
  }

  // ✅ Authorized: render the protected component
  return children;
}

export default ProtectedRoute;
