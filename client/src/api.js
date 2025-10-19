import axios from "axios";

// =====================================================
// 🌍 BASE CONFIGURATION (✅ AUTO DETECTION FOR PROD)
// =====================================================
const API_BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5000"
    : "https://personalised-recommendations.onrender.com";

const API = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// =====================================================
// 🔐 AUTH TOKEN HANDLING
// =====================================================
API.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (e) {
    console.warn("⚠️ Failed to attach token:", e);
  }
  return config;
});

// =====================================================
// 🧑‍💻 AUTH
// =====================================================
export const signup = (data) => API.post("/auth/signup", data);
export const login = (data) => API.post("/auth/login", data);

// =====================================================
// 🎬📚🎵 USER PREFERENCES
// =====================================================
export const saveMoviePreferences = (email, data) =>
  API.post(`/users/preferences/${email}/movies`, data);
export const getMoviePreferences = (email) =>
  API.get(`/users/preferences/${email}/movies`);

export const saveBookPreferences = (email, data) =>
  API.post(`/users/preferences/${email}/books`, data);
export const getBookPreferences = (email) =>
  API.get(`/users/preferences/${email}/books`);

export const saveMusicPreferences = (email, data) =>
  API.post(`/users/preferences/${email}/music`, data);
export const getMusicPreferences = (email) =>
  API.get(`/users/preferences/${email}/music`);

export const getPreferences = (email, type = "movies") => {
  if (type === "books") return getBookPreferences(email);
  if (type === "music") return getMusicPreferences(email);
  return getMoviePreferences(email);
};

// =====================================================
// 🎧 SPOTIFY INTEGRATION
// =====================================================
export const getSpotifyToken = async () => {
  const res = await API.get("/spotify/token");
  return res.data.accessToken;
};

export const getSpotifyGenres = async () => {
  const res = await API.get("/spotify/genres");
  return res.data;
};

export const getSpotifyRecommendations = async (genres = []) => {
  const res = await API.post("/spotify/recommendations", { genres });
  return res.data;
};

// =====================================================
// 🎯 RECOMMENDATIONS
// =====================================================
export const getRecommendations = (email, type = "movies") =>
  API.get(`/recommendations/${email}/${type}`);

export const getRecommendationExplanation = (id, email, type = "movies") =>
  API.get(`/recommendations/${id}/explain`, { params: { email, type } });

export const getGlobalExplanations = (type = "movies") =>
  API.get(`/recommendations/global-explain`, { params: { type } });

export async function fetchRecommendations(email, type = "movies") {
  try {
    const res = await API.get(`/recommendations/${email}/${type}`);
    if (res.data && res.data.recommendations?.length > 0) {
      return res.data.recommendations;
    }

    console.warn(`⚠️ No ${type} recommendations found for ${email}`);
    return [];
  } catch (err) {
    console.error(`❌ Error fetching ${type} recommendations:`, err.message);
    const fallback = {
      movies: [
        {
          title: "Inception",
          year: "2010",
          poster:
            "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg",
          overview:
            "A skilled thief uses dream-sharing technology to perform corporate espionage.",
        },
      ],
      books: [
        {
          title: "The Alchemist",
          authors: ["Paulo Coelho"],
          publishedDate: "1988",
          thumbnail: "https://covers.openlibrary.org/b/id/240726-L.jpg",
        },
      ],
      music: [
        {
          title: "Blinding Lights",
          artist: "The Weeknd",
          artwork:
            "https://upload.wikimedia.org/wikipedia/en/0/09/The_Weeknd_-_Blinding_Lights.png",
          previewUrl: "https://samplelib.com/lib/preview/mp3/sample-3s.mp3",
        },
      ],
    };
    return fallback[type] || [];
  }
}

// =====================================================
// 💬 FEEDBACK
// =====================================================
export const submitFeedback = async (data) => {
  const res = await API.post("/feedback", data);
  return res.data;
};

export const getFeedbackStats = async (contentId) => {
  const res = await API.get(`/feedback/${contentId}`);
  return res.data;
};

export const getReviews = async (contentId) => {
  const res = await API.get(`/feedback/${contentId}/reviews`);
  return res.data;
};

// =====================================================
// 😊 MOOD
// =====================================================
export const saveMood = (userId, data) => API.post(`/mood/${userId}`, data);

// =====================================================
// 👥 GROUP SYNC
// =====================================================
export const createGroup = (data) => API.post("/groupsync", data);
export const getGroup = (id) => API.get(`/groupsync/${id}`);

// =====================================================
// ⚙️ ADMIN
// =====================================================
export const updateAlgorithmConfig = (data) =>
  API.put("/admin/algorithm/config", data);
export const reindexContent = (data) =>
  API.post("/admin/content/reindex", data);

// =====================================================
// 💬 CHAT
// =====================================================
export const sendMessage = (message) =>
  API.post("/chat", { message }).then((res) => res.data);

// =====================================================
// 🎥 TMDB SEARCH
// =====================================================
export const searchMovies = async (query) => {
  const res = await fetch(`${API_BASE_URL}/api/tmdb?q=${encodeURIComponent(query)}`);
  return res.json();
};

// =====================================================
// 🤖 CROSS-DOMAIN RECOMMENDATIONS
// =====================================================
export const getCrossDomainRecommendations = (email, { query, base }) => {
  const params = query
    ? `query=${encodeURIComponent(query)}`
    : `base=${encodeURIComponent(base || "music")}`;
  return API.get(`/recommendations/cross/${email}?${params}`);
};

// =====================================================
// 🚨 GLOBAL ERROR HANDLER
// =====================================================
API.interceptors.response.use(
  (res) => res,
  (error) => {
    console.error("❌ API Error:", error.response?.data || error.message);
    const status = error?.response?.status;

    if (status === 401 || status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/login") &&
        !window.location.pathname.startsWith("/signup")
      ) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default API;
export { API_BASE_URL };
