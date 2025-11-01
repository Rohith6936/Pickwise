// ===============================================================
// 🌱 Load Environment Variables
// ===============================================================
import dotenv from "dotenv";
dotenv.config();

// ===============================================================
// 📦 Imports & Setup
// ===============================================================
import axios from "axios";
import User from "../models/User.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ===============================================================
// ⚙️ Gemini API Setup with Validation
// ===============================================================
const GEMINI_KEY = process.env.GEMINI_API_KEY?.trim();
let genAI = null;

if (!GEMINI_KEY || !GEMINI_KEY.startsWith("AIza")) {
  console.warn("⚠️ Invalid or missing GEMINI_API_KEY — AI features disabled.");
} else {
  try {
    genAI = new GoogleGenerativeAI(GEMINI_KEY);
    console.log("✅ Gemini API initialized successfully.");
  } catch (err) {
    console.error("❌ Failed to initialize Gemini API:", err.message);
  }
}

// ===============================================================
// 🧩 Fallback Recommendations
// ===============================================================
const FALLBACK_RECOMMENDATIONS = {
  movie: [
    {
      title: "Inception",
      year: "2010",
      overview: "A skilled thief uses dream-sharing technology for corporate espionage.",
      poster: "https://m.media-amazon.com/images/I/51FCK3VfBLL._AC_.jpg",
    },
    {
      title: "Interstellar",
      year: "2014",
      overview: "A team travels through a wormhole in search of a new home for humanity.",
      poster: "https://m.media-amazon.com/images/I/81tEgsxpNZS._AC_SL1500_.jpg",
    },
  ],
  book: [
    {
      title: "The Alchemist",
      authors: ["Paulo Coelho"],
      description: "A story about following your dreams and destiny.",
      thumbnail: "https://covers.openlibrary.org/b/id/240726-L.jpg",
    },
    {
      title: "1984",
      authors: ["George Orwell"],
      description: "A dystopian novel exploring government surveillance and freedom.",
      thumbnail: "https://covers.openlibrary.org/b/id/7222246-L.jpg",
    },
  ],
  music: [
    {
      title: "Blinding Lights",
      artist: "The Weeknd",
      artwork:
        "https://upload.wikimedia.org/wikipedia/en/0/09/The_Weeknd_-_Blinding_Lights.png",
    },
    {
      title: "Shape of You",
      artist: "Ed Sheeran",
      artwork:
        "https://upload.wikimedia.org/wikipedia/en/4/45/Shape_Of_You_%28Official_Single_Cover%29_by_Ed_Sheeran.png",
    },
  ],
};

// ===============================================================
// 🕐 Timeout Helper
// ===============================================================
async function withTimeout(promise, ms = 20000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);
}

// ===============================================================
// 🎬 MOVIE DETAILS
// ===============================================================
async function getMovieDetails(title) {
  try {
    const res = await withTimeout(
      axios.get("http://www.omdbapi.com/", {
        params: { apikey: process.env.OMDB_API_KEY, t: title },
      }),
      8000
    );
    const d = res.data;
    if (d.Response === "False") return null;
    return {
      title: d.Title,
      year: d.Year,
      poster: d.Poster,
      genres: d.Genre ? d.Genre.split(", ") : [],
      overview: d.Plot || "No description available.",
      imdbRating: d.imdbRating || "N/A",
    };
  } catch (err) {
    console.error("🎬 OMDb Error:", err.message);
    return null;
  }
}

// ===============================================================
// 📚 BOOK DETAILS
// ===============================================================
async function getBookDetails(title) {
  try {
    const res = await withTimeout(
      axios.get("https://www.googleapis.com/books/v1/volumes", {
        params: { q: title, key: process.env.GOOGLE_BOOKS_API_KEY },
      }),
      8000
    );
    const item = res.data.items?.[0];
    if (!item) return null;
    const info = item.volumeInfo;
    return {
      title: info.title || title,
      authors: info.authors || ["Unknown Author"],
      description: info.description || "No description available.",
      thumbnail: info.imageLinks?.thumbnail || "",
      categories: info.categories || [],
      publishedDate: info.publishedDate || "N/A",
    };
  } catch (err) {
    console.error("📚 Google Books Error:", err.message);
    return null;
  }
}

// ===============================================================
// 🎵 MUSIC DETAILS
// ===============================================================
async function getMusicDetails(term) {
  try {
    const res = await withTimeout(
      axios.get("https://itunes.apple.com/search", {
        params: { term, media: "music", limit: 1 },
      }),
      8000
    );
    const item = res.data.results?.[0];
    if (!item) return null;
    return {
      title: item.trackName || term,
      artist: item.artistName || "Unknown Artist",
      album: item.collectionName || "Unknown Album",
      artwork: item.artworkUrl100 || "",
      previewUrl: item.previewUrl || "",
    };
  } catch (err) {
    console.error("🎵 iTunes Error:", err.message);
    return null;
  }
}

// ===============================================================
// 🧠 Safe Gemini Request (retry + automatic model fallback)
// ===============================================================
async function safeGeminiRequest(prompt) {
  if (!genAI) throw new Error("Gemini not initialized");

  // ✅ Latest working Gemini models (2.5 generation)
  const models = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro"];

  for (const m of models) {
    try {
      console.log(`🤖 Trying Gemini model: ${m}`);
      const model = genAI.getGenerativeModel({ model: m });
      const result = await withTimeout(model.generateContent(prompt), 20000);
      const text = result?.response?.text?.();
      if (text) return text;
    } catch (err) {
      console.warn(`⚠️ Model ${m} failed: ${err.message}`);
      if (err.message.includes("API key not valid")) {
        console.error("🚨 Invalid Gemini API key. Please check .env or regenerate.");
        throw err;
      }
    }
  }

  throw new Error("All Gemini models failed");
}

// ===============================================================
// 🎯 Single-Domain Recommendations (Enhanced Prompt + Era + Tone)
// ===============================================================
export const getRecommendations = async (email, type = "movies") => {
  try {
    const user = await User.findOne({ email });
    if (!user) throw new Error("User not found");

    type = type.toLowerCase();
    const singularType = type.endsWith("s") ? type.slice(0, -1) : type;
    const prefs = user.preferences?.[type] || {};

    const genres = (prefs.genres || []).join(", ") || "any genre";
    const favorites = (prefs.favorites || []).join(", ") || "none";
    const era = prefs.era || "any era";

    const prompt = `
You are an expert in recommending ${type}.
Suggest 5 ${singularType === "book" ? "books" : singularType === "music" ? "songs or artists" : "movies"} 
that align with these preferences:

1️⃣ Genres: ${genres}
2️⃣ Favorites: ${favorites}
3️⃣ Era: ${era}

Focus on similar mood, tone, and storytelling style. Output plain ${singularType} names, one per line, no numbering.
`;

    let names = [];
    let aiWorked = false;

    // 🧠 Try Gemini 2.5
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await withTimeout(model.generateContent(prompt), 15000);
      const rawText = result?.response?.text?.() || "";

      names = rawText
        .split(/\r?\n/)
        .map((x) => x.replace(/^[\-\*\d\.\)\s"]+|["]+$/g, "").trim())
        .filter(Boolean);

      aiWorked = names.length > 0;

      if (aiWorked) {
        console.log(`🎬 Gemini suggested ${names.length} ${type} for ${email}:`);
        names.forEach((title, i) => console.log(`  ${i + 1}️⃣ ${title}`));
      } else {
        console.warn(`⚠️ Gemini returned no valid ${type} names for ${email}.`);
        console.log("Raw Gemini output:", rawText);
      }
    } catch (err) {
      console.warn("💡 Gemini unavailable — using cache/fallback.", err.message);
    }

    // 📦 Use cache or fallback
    if (!aiWorked && user.recommendationsCache?.[type]?.length) {
      console.log(`🗃 Using cached ${type} recommendations for ${email}`);
      return user.recommendationsCache[type];
    }

    const fallback = {
      movie: ["Inception", "Interstellar", "Titanic"],
      book: ["Harry Potter", "The Hobbit", "1984"],
      music: ["Blinding Lights", "Shape of You", "Bohemian Rhapsody"],
    }[singularType];

    const items = names.length ? names : fallback;
    const detailPromises = items.map((n) =>
      singularType === "book"
        ? getBookDetails(n)
        : singularType === "music"
        ? getMusicDetails(n)
        : getMovieDetails(n)
    );

    const details = (await Promise.all(detailPromises)).filter(Boolean);

    // 💾 Cache AI results
    if (aiWorked) {
      user.recommendationsCache[type] = details;
      user.recommendationsCache.lastUpdated = new Date();
      await user.save();
      console.log(`✅ ${type} recommendations cached for ${email}`);
    }

    return details.length ? details : fallback.map((title) => ({ title }));
  } catch (err) {
    console.error("❌ Recommendation Error:", err.message);
    return [];
  }
};

// ===============================================================
// 🌍 Cross-Domain Recommendations
// ===============================================================
export const getCrossDomainRecommendations = async (email, query = "romantic adventure") => {
  try {
    const prompt = `
User Query: "${query}"
Suggest 3 relevant Movies, Music, and Books for this mood.

Movies:
- ...
Music:
- ...
Books:
- ...

Only plain text lists.
`;

    let text = "";
    try {
      text = await safeGeminiRequest(prompt);
    } catch (err) {
      console.warn("💡 Gemini down — using fallback for cross-domain.");
      return {
        baseQuery: query,
        recommendations: {
          movies: FALLBACK_RECOMMENDATIONS.movie,
          music: FALLBACK_RECOMMENDATIONS.music,
          books: FALLBACK_RECOMMENDATIONS.book,
        },
      };
    }

    const extract = (section) =>
      text
        .split(new RegExp(`${section}:`, "i"))[1]
        ?.split(/\n(?=[A-Z])/)[0]
        ?.split(/\r?\n/)
        ?.map((x) => x.replace(/^[\-\*\d\.\)\s"]+|["]+$/g, "").trim())
        .filter(Boolean) || [];

    const movies = extract("Movies");
    const music = extract("Music");
    const books = extract("Books");

    const movieDetails = (await Promise.all(movies.map(getMovieDetails))).filter(Boolean);
    const musicDetails = (await Promise.all(music.map(getMusicDetails))).filter(Boolean);
    const bookDetails = (await Promise.all(books.map(getBookDetails))).filter(Boolean);

    return {
      baseQuery: query,
      recommendations: {
        movies: movieDetails.length ? movieDetails : FALLBACK_RECOMMENDATIONS.movie,
        music: musicDetails.length ? musicDetails : FALLBACK_RECOMMENDATIONS.music,
        books: bookDetails.length ? bookDetails : FALLBACK_RECOMMENDATIONS.book,
      },
    };
  } catch (err) {
    console.error("❌ Cross-Domain Error:", err.message);
    return { baseQuery: query, recommendations: FALLBACK_RECOMMENDATIONS };
  }
};
