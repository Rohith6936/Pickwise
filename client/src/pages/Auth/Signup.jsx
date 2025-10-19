import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/Auth.css";

function Signup() {
  const navigate = useNavigate();

  // --- state ---
  const [form, setForm] = useState({ email: "", password: "", role: "user" });
  const [otp, setOtp] = useState("");
  const [phase, setPhase] = useState("enter"); // "enter" | "otp"
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Use environment variable for backend API
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // --- handle input changes ---
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // --- send otp ---
  const sendOtp = async (e) => {
    e.preventDefault();
    setStatus("");
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });

      const text = await resp.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text };
      }

      if (!resp.ok) throw new Error(data.error || "Failed to send OTP");

      setLoading(false);
      setPhase("otp");
      setStatus("✅ OTP sent to your email!");
    } catch (err) {
      setLoading(false);
      setStatus("Error sending OTP: " + err.message);
    }
  };

  // --- verify otp + signup ---
  const verifyOtp = async (e) => {
    e.preventDefault();
    setStatus("");
    setLoading(true);
    try {
      // ✅ Step 1: Verify OTP
      const verifyResp = await fetch(`${API_BASE_URL}/api/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, otp }),
      });

      const verifyData = await verifyResp.json();
      if (!verifyResp.ok || !verifyData.ok)
        throw new Error(verifyData.error || "Invalid OTP");

      // ✅ Step 2: Create user after OTP verified
      const signupResp = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const signupData = await signupResp.json();
      if (!signupResp.ok)
        throw new Error(signupData.error || "Signup failed.");

      setStatus("✅ Signup successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setLoading(false);
      setStatus("Error verifying OTP: " + err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Signup</h2>

        {status && (
          <p style={{ color: status.startsWith("Error") ? "red" : "limegreen" }}>
            {status}
          </p>
        )}

        {/* --- PHASE 1: enter email/password --- */}
        {phase === "enter" && (
          <form onSubmit={sendOtp}>
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
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* --- PHASE 2: enter otp --- */}
        {phase === "otp" && (
          <form onSubmit={verifyOtp}>
            <input
              type="text"
              name="otp"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP & Signup"}
            </button>
          </form>
        )}

        <div className="auth-footer">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Signup;
