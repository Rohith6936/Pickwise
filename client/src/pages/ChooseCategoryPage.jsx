// src/pages/ChooseCategoryPage.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ChooseCategoryPage.css";
import "../styles/App.css"; // ✅ For FAB and button styles

import {
  FaFilm,
  FaBookOpen,
  FaMusic,
  FaRobot,
  FaArrowLeft,
  FaArrowRight,
} from "react-icons/fa";
import Navbar from "../pages/Navbar"; // ✅ Correct path

const ChooseCategoryPage = () => {
  const navigate = useNavigate();

  // ✅ Prevent navigating back to login from Choose page
  useEffect(() => {
    try {
      const path = window.location.pathname;
      window.history.replaceState(null, "", path);
      const handlePop = (e) => {
        // Push forward to stay on this page
        window.history.go(1);
      };
      window.addEventListener("popstate", handlePop);
      return () => window.removeEventListener("popstate", handlePop);
    } catch (err) {
      console.error("Navigation control error:", err);
    }
  }, []);

  const handleChoice = (type) => {
    localStorage.setItem("selectedCategory", type);
    if (type === "movies") navigate("/preferences");
    else if (type === "book") navigate("/book-preferences");
    else if (type === "music") navigate("/music-preferences");
  };

  // ✅ Navigation FABs
  const goBack = () => navigate(-1);
  const goForward = () => navigate(1);

  return (
    <div className="choose-container">
      {/* 🌐 Top Navigation Bar */}
      <Navbar hideHome hideMood hidePreferences />

      {/* 🧠 Main Title */}
      <h1 className="choose-title">
        What would you like recommendations for today?
      </h1>

      {/* 🎬 Category Cards */}
      <div className="card-grid">
        <div className="category-card" onClick={() => handleChoice("movies")}>
          <FaFilm className="card-icon movie-icon" />
          <h2>Movies</h2>
          <p>Explore trending films, timeless classics, and hidden gems.</p>
        </div>

        <div className="category-card" onClick={() => handleChoice("book")}>
          <FaBookOpen className="card-icon book-icon" />
          <h2>Books</h2>
          <p>Discover inspiring reads, bestsellers, and must-read stories.</p>
        </div>

        <div className="category-card" onClick={() => handleChoice("music")}>
          <FaMusic className="card-icon music-icon" />
          <h2>Music</h2>
          <p>Listen to popular hits, timeless tunes, and hidden melodies.</p>
        </div>

        {/* 🧠 Smart Recommendations Card */}
        <div
          className="category-card smart-card"
          onClick={() => navigate("/recommendations-hub")}
        >
          <FaRobot className="card-icon smart-icon" />
          <h2>Smart Recommendations</h2>
          <p>
            Get personalized movie, music, and book picks based on your saved
            preferences.
          </p>
        </div>
      </div>

      {/* 🔄 Floating Navigation Buttons */}
      <div className="nav-fab">
        <button
          className="fab-btn fab-secondary"
          onClick={goBack}
          title="Go Back"
        >
          <FaArrowLeft />
        </button>
        <button
          className="fab-btn fab-primary"
          onClick={goForward}
          title="Go Forward"
        >
          <FaArrowRight />
        </button>
      </div>
    </div>
  );
};

export default ChooseCategoryPage;
