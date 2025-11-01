import { useEffect, useState } from "react";
import "../styles/Home.css";
import API, { getRecommendations, getPreferences } from "../api";
import RecommendationCard from "../components/RecommendationCard";
import Navbar from "../pages/Navbar";
import { toast, Toaster } from "react-hot-toast";

function Home() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(getMessage());
  const [preferences, setPreferences] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [usedCache, setUsedCache] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const email = storedUser ? JSON.parse(storedUser).email : null;

    if (!email) {
      console.error("⚠️ No email found in localStorage.");
      setLoading(false);
      return;
    }

    // ✅ Load preferences (from localStorage or backend)
    const localPrefs = localStorage.getItem(`preferences_${email}`);
    if (localPrefs) {
      setPreferences(JSON.parse(localPrefs));
    } else {
      getPreferences(email)
        .then(({ data }) => {
          const prefs = data?.data || data;
          if (prefs) {
            setPreferences(prefs);
            localStorage.setItem(`preferences_${email}`, JSON.stringify(prefs));
          }
        })
        .catch(() => console.warn("⚠️ No preferences found in backend."));
    }

    // ✅ Fetch movie recommendations (cached-first)
    const fetchRecommendations = async () => {
      try {
        const { data } = await getRecommendations(email);

        if (data?.usedCache || data?.fromCache) {
          setUsedCache(true);
          toast("⚠️ Showing cached recommendations (AI offline)", {
            icon: "⚠️",
            duration: 4000,
          });
        }

        if (data?.lastUpdated) {
          setLastUpdated(new Date(data.lastUpdated));
        }

        const list = data.recommendations || data || [];
        if (!list || list.length === 0) {
          console.warn("⚠️ No fresh recommendations, checking history...");
          fetchHistory();
        } else {
          setRecommendations(formatMovies(list));
          setLoading(false);
        }
      } catch (err) {
        console.error("❌ Error fetching fresh recs:", err);
        fetchHistory();
      }
    };

    // ✅ Fetch from history (if AI fails)
    const fetchHistory = async () => {
      try {
        const { data } = await API.get(`/recommendations/${email}/history`);
        const latest = data?.history?.[0]?.movies || [];
        if (latest.length > 0) {
          setRecommendations(formatMovies(latest));
          setUsedCache(true);
          toast("🕒 Showing last saved recommendations.", { icon: "🕒" });
        } else {
          setRecommendations([]);
        }
      } catch (err) {
        console.error("❌ Error fetching history:", err);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();

    // 🕒 Update greeting every minute
    const interval = setInterval(() => setMessage(getMessage()), 60000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Force Refresh Recommendations (Gemini re-generation)
  const handleRefresh = async () => {
    const storedUser = localStorage.getItem("user");
    const email = storedUser ? JSON.parse(storedUser).email : null;

    if (!email) {
      toast.error("⚠️ Unable to refresh — user not logged in.");
      return;
    }

    setLoading(true);
    setUsedCache(false);
    toast.loading("🔁 Generating fresh recommendations...", { id: "refresh" });

    try {
      const { data } = await API.get(`/recommendations/${email}/movies?force=true`);

      if (data?.success) {
        setRecommendations(formatMovies(data.recommendations));
        toast.success("✨ New recommendations generated!", { id: "refresh" });

        if (data?.lastUpdated) {
          setLastUpdated(new Date(data.lastUpdated));
        }

        setUsedCache(false);
      } else {
        toast.error("Failed to generate new recommendations.", { id: "refresh" });
      }
    } catch (err) {
      console.error("❌ Error during forced refresh:", err);
      toast.error("Error while refreshing recommendations.", { id: "refresh" });
    } finally {
      setLoading(false);
    }
  };

  // 🕒 Format last updated time
  const formattedLastUpdated = lastUpdated
    ? new Date(lastUpdated).toLocaleString()
    : null;

  return (
    <div className="home-container">
      <Navbar />
      <Toaster position="top-center" />

      <div className="hero">
        <h1>
          <span className="glow">{message}</span>
          <br />
          <span className="highlight">Let's Discover</span>
        </h1>
        <p>
          Your personal AI discovers amazing movies tailored to your unique
          taste and preferences.
        </p>

        {/* ✅ Display Preferences Summary */}
        {preferences && (
          <p style={{ marginTop: "1rem", fontStyle: "italic" }}>
            🎯 Based on your preferences:{" "}
            {preferences.genres?.length
              ? preferences.genres.join(", ")
              : "No genres"}{" "}
            | {preferences.era || "No era selected"} | Favorites:{" "}
            {Array.isArray(preferences.favorites)
              ? preferences.favorites.join(", ")
              : preferences.favorites || "None"}
          </p>
        )}

        {/* 🧠 Cache Info */}
        {formattedLastUpdated && (
          <p style={{ color: "#ccc", fontSize: "0.9rem" }}>
            🕒 Last AI update: {formattedLastUpdated}
            {usedCache && " (cached results)"}
          </p>
        )}

        <div className="button-row">
          <button
            className="primary-button"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? "⏳ Refreshing..." : "🔁 Refresh Recommendations"}
          </button>
        </div>
      </div>

      {/* 🎬 Recommendations Section */}
      <div className="carousel">
        <h2 className="carousel-heading">Your Top Picks</h2>
        {loading ? (
          <p>⏳ Loading recommendations...</p>
        ) : recommendations.length > 0 ? (
          <div className="cards-scroll">
            {recommendations.map((movie, index) => (
              <RecommendationCard
                key={movie.id || movie._id || index}
                item={{
                  id: movie.id || movie._id || index,
                  title: movie.title,
                  overview: movie.overview,
                  poster: movie.poster,
                  year: movie.releaseDate,
                  watchProviders: movie.watchProviders || [
                    "Netflix",
                    "Amazon Prime",
                  ],
                }}
                type="movie"
              />
            ))}
          </div>
        ) : (
          <p>😔 No recommendations found. Please set your preferences.</p>
        )}
      </div>
    </div>
  );
}

// ✅ Helper — format movie list safely
function formatMovies(list) {
  return list.map((movie, index) => ({
    id: movie.id || movie._id || index,
    title: movie.title,
    overview: movie.overview || "No description available.",
    poster:
      movie.poster && movie.poster !== "N/A"
        ? movie.poster
        : "/placeholder.png",
    releaseDate: movie.year || "Unknown",
    rating: movie.genres ? movie.genres.join(", ") : "N/A",
    watchProviders: movie.watchProviders || ["Netflix", "Amazon Prime"],
  }));
}

// ✅ Helper — dynamic greeting message
function getMessage() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return "☀️ Start your day with an amazing movie!";
  if (hour >= 12 && hour < 17) return "🌟 Take a break, enjoy a great film!";
  if (hour >= 17 && hour < 21) return "🎬 Perfect evening for a blockbuster!";
  return "🌙 Relax with a late-night classic!";
}

export default Home;
