import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  saveMoviePreferences as savePreferences,
  getMoviePreferences as getPreferences,
} from "../api";
import "../styles/Preferences.css";
import { toast, Toaster } from "react-hot-toast";
import Navbar from "../pages/Navbar";

export default function Preferences() {
  const [genres, setGenres] = useState([]);
  const [era, setEra] = useState("");
  const [favorites, setFavorites] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const genreList = [
    "Action",
    "Adventure",
    "Comedy",
    "Drama",
    "Romance",
    "Thriller",
    "Sci-Fi",
    "Fantasy",
    "Animation",
  ];

  const toggleGenre = (g) => {
    setGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  };

  // ✅ Load saved preferences
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const email = storedUser ? JSON.parse(storedUser).email : null;
    if (!email) return;

    getPreferences(email)
      .then(({ data }) => {
        const prefs = data?.data || data || {};
        setGenres(prefs.genres || []);
        setEra(prefs.era || "");
        setFavorites((prefs.favorites || []).join(", "));
      })
      .catch((err) => {
        console.warn("ℹ️ No preferences found:", err.message);
      });
  }, []);

  // ✅ Save preferences
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const storedUser = localStorage.getItem("user");
    const email = storedUser ? JSON.parse(storedUser).email : null;

    if (!email) {
      toast.error("No user email found. Please log in again.");
      setLoading(false);
      return;
    }

    const userPrefs = {
      genres,
      era,
      favorites: favorites
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean),
    };

    try {
      console.log("📧 Sending Preferences:", email, userPrefs);
      const res = await savePreferences(email, userPrefs);
      console.log("📩 API Response:", res);

      // ✅ Handle both success types
      if (res.data?.success || res.status === 200) {
        localStorage.setItem(`preferences_${email}`, JSON.stringify(userPrefs));
        toast.success("✅ Preferences saved successfully!");
        navigate("/home");
      } else {
        toast.error(res.data?.message || "Failed to save preferences.");
      }
    } catch (err) {
      console.error("❌ Error saving preferences:", err);
      toast.error("Failed to save preferences. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="preferences-container">
      <Navbar hideHome hidePreferences hideProfile />
      <Toaster position="top-center" reverseOrder={false} />

      <form className="preferences-card" onSubmit={handleSubmit}>
        <h2>🎬 Movie Preferences</h2>

        <h3>1️⃣ Select your favorite genres</h3>
        <div className="genre-list">
          {genreList.map((g) => (
            <div
              key={g}
              className={`genre-item ${genres.includes(g) ? "selected" : ""}`}
              onClick={() => toggleGenre(g)}
            >
              {g}
            </div>
          ))}
        </div>

        <h3>2️⃣ What kind of movies do you prefer?</h3>
        <select value={era} onChange={(e) => setEra(e.target.value)} required>
          <option value="">-- Select Era --</option>
          <option value="Recent">✨ Recent (After 2015)</option>
          <option value="Classic">🎥 Classic (Before 2015)</option>
          <option value="Both">🎬 Both</option>
        </select>

        <h3>3️⃣ Name 2–3 of your favorite movies</h3>
        <textarea
          placeholder="Type your favorite movies (comma-separated)..."
          value={favorites}
          onChange={(e) => setFavorites(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Continue →"}
        </button>
      </form>
    </div>
  );
}
