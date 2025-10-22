// src/pages/UserDashboard.jsx
import React, { useEffect, useState } from "react";
import { getPreferences, getRecommendations } from "../api";

function UserDashboard() {
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      // ✅ Fetch preferences with safe fallback
      getPreferences(parsedUser.email)
        .then((res) => {
          const prefs = res?.data ?? null;
          setPreferences(prefs);
        })
        .catch((err) => {
          console.error("❌ Preferences fetch error:", err);
          setMessage("❌ Failed to fetch preferences");
        });

      // ✅ Fetch recommendations with robust data structure handling
      getRecommendations(parsedUser.email)
        .then((res) => {
          const data = res?.data ?? [];
          const recs = Array.isArray(data?.recommendations)
            ? data.recommendations
            : Array.isArray(data)
            ? data
            : [];
          setRecommendations(recs);
        })
        .catch((err) => {
          console.error("❌ Recommendations fetch error:", err);
          setMessage("❌ Failed to fetch recommendations");
          setRecommendations([]);
        });
    }
  }, []);

  if (!user) {
    return <p>Loading user...</p>;
  }

  return (
    <div className="user-dashboard" style={{ padding: "2rem" }}>
      <h2>👤 User Dashboard</h2>
      <p>
        <strong>Name:</strong> {user.name} <br />
        <strong>Email:</strong> {user.email} <br />
        <strong>Role:</strong> {user.role}
      </p>

      <h3>🎯 Your Preferences</h3>
      {preferences ? (
        <pre>{JSON.stringify(preferences, null, 2)}</pre>
      ) : (
        <p>No preferences found</p>
      )}

      <h3>🎬 Recommendations for You</h3>
      {Array.isArray(recommendations) && recommendations.length > 0 ? (
        <ul>
          {recommendations.map((item, index) => (
            <li key={index}>
              {typeof item === "string" ? item : JSON.stringify(item)}
            </li>
          ))}
        </ul>
      ) : (
        <p>No recommendations available</p>
      )}

      {message && <p>{message}</p>}
    </div>
  );
}

export default UserDashboard;
