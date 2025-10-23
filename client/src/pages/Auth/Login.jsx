// src/pages/Auth/Login.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login, getPreferences } from "../../api";
import "../../styles/Auth.css";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // ✅ Show "Logging in..." feedback

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // ✅ Step 1: Authenticate user
      const res = await login(form);
      const { token, user } = res.data || {};

      if (!token || !user) throw new Error("Invalid login response from server");

      // ✅ Step 2: Save authentication info
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userEmail", user.email);

      const email = user.email;
      const role = user.role || "user";

      // ✅ Step 3: Redirect admin users
      if (role === "admin") {
        navigate("/admin", { replace: true });
        return;
      }

      // ✅ Step 4: Check local preferences
      const localPrefs = localStorage.getItem(`preferences_${email}`);
      if (localPrefs) {
        navigate("/choose", { replace: true });
        return;
      }

      // ✅ Step 5: Try fetching preferences from backend
      try {
        const prefsRes = await getPreferences(email);
        const prefs = prefsRes?.data?.data || prefsRes?.data || {};

        if (prefs?.genres?.length > 0) {
          localStorage.setItem(`preferences_${email}`, JSON.stringify(prefs));
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/choose", { replace: true });
        }
      } catch (err) {
        console.error("❌ Error fetching preferences:", err);
        navigate("/preferences", { replace: true });
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

        {error && <p className="auth-error">{error}</p>}

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
