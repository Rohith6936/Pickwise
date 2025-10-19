import React, { useState } from "react";
import axios from "axios";
import "../styles/MusicModePages.css";
import { API_BASE_URL } from "../api"; // ✅ Import dynamic base URL

// ✅ Use environment-aware API base
const API = axios.create({ baseURL: `${API_BASE_URL}/api/spotify` });

export default function PopularityMusicPage() {
  const [popType, setPopType] = useState("");
  const [tracks, setTracks] = useState([]);
  const [allTracks, setAllTracks] = useState([]);

  async function fetchPopular() {
    try {
      const res = await API.get(`/popular?type=${popType}`);
      const fetchedTracks = res.data || [];
      setAllTracks(fetchedTracks);
      setTracks(getRandomFive(fetchedTracks));
    } catch (err) {
      console.error("❌ Failed to fetch popular tracks:", err.message);
      alert("Failed to fetch popular tracks!");
    }
  }

  function getRandomFive(trackList) {
    if (trackList.length <= 5) return trackList;
    const shuffled = [...trackList].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 5);
  }

  function refreshRecommendations() {
    setTracks(getRandomFive(allTracks));
  }

  return (
    <div className="popularity-page">
      <h1>📈 Explore by Popularity</h1>
      <p>Find most popular, trending, or newly released tracks!</p>

      <div className="popularity-controls">
        <select onChange={(e) => setPopType(e.target.value)}>
          <option value="">Select Option</option>
          <option value="most">Most Popular</option>
          <option value="trending">Currently Trending</option>
          <option value="new">New Releases</option>
          <option value="least">Least Popular</option>
        </select>
        <button onClick={fetchPopular}>Show Tracks</button>
      </div>

      {tracks.length > 0 && (
        <div className="results">
          <h3>Recommended Tracks</h3>
          <button className="refresh-btn" onClick={refreshRecommendations}>
            🔄 Refresh Recommendations
          </button>

          <div className="track-grid">
            {tracks.map((t) => (
              <div key={t.id} className="track-card">
                <img
                  src={t.album.images[0]?.url}
                  alt={t.name || "Album cover"}
                />
                <p>{t.name}</p>
                <small>{t.artists.map((a) => a.name).join(", ")}</small>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
