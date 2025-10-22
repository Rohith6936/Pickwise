// finalworking/p6/client/src/pages/AboutUs.jsx
import React from "react";
import { FaInfoCircle, FaFilm, FaMusic, FaBookOpen } from "react-icons/fa";

function AboutUs() {
  return (
    <div className="container">
      <div className="hero-section">
        <h1 className="hero-title">About PickWise</h1>
        <p className="hero-subtitle">
          PickWise helps you discover movies, music, and books you'll love using your
          preferences, mood, and collaborative features. Seamlessly explore
          personalized recommendations with a modern, elegant interface.
        </p>
      </div>

      <div className="content-card">
        <h2 className="text-primary" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FaInfoCircle /> What we do
        </h2>
        <p className="mt-4">
          We combine your saved preferences, trending data, and AI-powered logic to
          curate a set of recommendations tailored to your taste, whether you're in
          the mood for a blockbuster, calming music, or an inspiring book.
        </p>
      </div>

      <div className="content-card">
        <h3 className="text-primary" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FaFilm /> Movies · <FaMusic /> Music · <FaBookOpen /> Books
        </h3>
        <p className="mt-4">
          Switch categories anytime and keep your profile consistent across the
          experience. Your dashboard aggregates your favorites and history so you
          can pick up right where you left off.
        </p>
      </div>
    </div>
  );
}

export default AboutUs;