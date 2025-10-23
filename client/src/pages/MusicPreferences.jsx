import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/MusicModePages.css";
import Navbar from "../components/Navbar"; // ✅ corrected import path

const MusicPreferences = () => {
  const navigate = useNavigate();

  return (
    <div className="music-mode-page">
      {/* 🎵 Navbar with hidden options */}
      <Navbar hideHome hidePreferences hideProfile hideMood />

      <h1>🎵 Music Preferences</h1>
      <p>Select how you want to explore music:</p>

      <div className="music-mode-options">
        {/* 🎤 Artist-based */}
        <div
          className="music-mode-card"
          onClick={() => navigate("/music/artist")}
        >
          <h2>🎤 Artist Based</h2>
          <p>Discover tracks based on your favorite singers</p>
        </div>

        {/* 📈 Popularity-based */}
        <div
          className="music-mode-card"
          onClick={() => navigate("/music/popularity")}
        >
          <h2>📈 Popularity Based</h2>
          <p>Explore most popular, trending, or newly released songs</p>
        </div>

        {/* 🤝 Blend Mode */}
        <div
          className="music-mode-card"
          onClick={() => navigate("/music/blend")}
        >
          <h2>🤝 Blend</h2>
          <p>Mix preferences of multiple users and discover shared favorites</p>
        </div>
      </div>
    </div>
  );
};

export default MusicPreferences;
