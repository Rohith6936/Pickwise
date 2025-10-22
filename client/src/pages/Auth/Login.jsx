// src/pages/Auth/Login.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login, getPreferences } from "../../api";
import "../../styles/Auth.css";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // ✅ Loading indicator

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // ✅ 1. Authenticate user
      const res = await login(form);
      const { token, user } = res.data || {};

      if (!token || !user) {
        throw new Error("Invalid login response from server");
      }

      // ✅ 2. Save authentication info
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userEmail", user.email);

      const email = user.email;
      const role = user.role || "user";

      // ✅ 3. Redirect admin users immediately
      if (role === "admin") {
        navigate("/admin");
        return;
      }

      // ✅ 4. Check for locally saved preferences
      const localPrefs = localStorage.getItem(`preferences_${email}`);
      if (localPrefs) {
        navigate("/choose");
        return;
      }

      // ✅ 5. Fetch preferences from backend if not found locally
      try {
        const prefsRes = await getPreferences(email);
        const prefs = prefsRes?.data?.data || prefsRes?.data || {};

        if (prefs?.genres?.length > 0) {
          localStorage.setItem(`preferences_${email}`, JSON.stringify(prefs));
          navigate("/dashboard");
        } else {
          navigate("/choose");
        }
      } catch (err) {
        console.error("❌ Error fetching preferences:", err);
        navigate("/preferences");
      }
    } catch (err) {
      console.error("❌ Login failed:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Invalid email or password. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Login</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="auth-footer">
          Don’t have an account?{" "}
          <Link to="/signup" className="auth-link">
            Signup
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
