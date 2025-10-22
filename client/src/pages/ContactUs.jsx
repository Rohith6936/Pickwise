// finalworking/p6/client/src/pages/ContactUs.jsx
import React, { useState } from "react";
import { FaEnvelope, FaUser, FaCommentDots, FaPaperPlane } from "react-icons/fa";
import { submitContact } from "../api";

function ContactUs() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await submitContact({ name, email, message });
      setSubmitted(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setError("❌ Failed to send message. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="hero-section">
        <h1 className="hero-title">Contact Us</h1>
        <p className="hero-subtitle">We'd love to hear from you. Send us a message and we'll get back to you.</p>
      </div>

      <div className="content-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaUser /> Name
            </label>
            <input id="name" className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaEnvelope /> Email
            </label>
            <input id="email" type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="message" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaCommentDots /> Message
            </label>
            <textarea id="message" className="form-input" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="How can we help?" required />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <FaPaperPlane /> {loading ? "Sending..." : "Send Message"}
          </button>
        </form>

        {error && (
          <p className="mt-4" style={{ color: 'salmon' }}>{error}</p>
        )}

        {submitted && !error && (
          <p className="mt-4" style={{ color: 'var(--text-secondary)' }}>
            ✅ Your message was sent successfully. We'll be in touch!
          </p>
        )}
      </div>
    </div>
  );
}

export default ContactUs;