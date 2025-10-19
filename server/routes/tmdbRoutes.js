import express from "express";
import https from "https";
import fetch from "node-fetch";

const router = express.Router();

// 🌐 Your Cloudflare Worker URL
const RELAY_BASE = "https://chatbot.akshaya-k2665.workers.dev";

router.get("/", async (req, res) => {
  const rawQuery = req.query.q?.trim();
  if (!rawQuery) return res.status(400).json({ error: "Missing query" });

  try {
    const query = rawQuery.toLowerCase();

    const genreMap = {
      action: 28,
      comedy: 35,
      romance: 10749,
      thriller: 53,
      drama: 18,
      horror: 27,
      "sci-fi": 878,
      science: 878,
      animation: 16,
      fantasy: 14,
    };
    const foundGenre = Object.keys(genreMap).find((g) => query.includes(g));
    const genreId = foundGenre ? genreMap[foundGenre] : null;

    const agent = new https.Agent({ rejectUnauthorized: false });
    let results = [];
    let meta = {};

    // Detect person-related queries
    const isPersonQuery = /by|directed|director|actor|starring/i.test(query);
    const isDirectorQuery = /directed|director|directed by/i.test(query);
    const isActorQuery = /starring|star|actor|actress/i.test(query);

    // ✅ Helper: Call your Cloudflare Worker
    async function callWorker(endpoint, params = "") {
      const url = `${RELAY_BASE}/?endpoint=${endpoint}${params ? "&" + params : ""}`;
      const resp = await fetch(url, { agent, compress: false });
      const text = await resp.text();
      try {
        return JSON.parse(text);
      } catch {
        return { results: [], cast: [], crew: [], message: "parse failed" };
      }
    }

    if (isPersonQuery) {
      let name = query
        .replace(/movies|movie|films?|by|directed|director|actor|actress|starring|show|list/gi, "")
        .trim();
      if (foundGenre) name = name.replace(new RegExp(foundGenre, "gi"), "").trim();

      if (name) {
        const personData = await callWorker("search/person", `query=${encodeURIComponent(name)}`);
        if (personData?.results?.length) {
          const person = personData.results[0];
          const personId = person.id;
          const creditsData = await callWorker(`person/${personId}/movie_credits`, "");

          let movieEntries = [];

          if (isDirectorQuery) {
            movieEntries = (creditsData.crew || []).filter((c) => c.job === "Director");
          } else if (isActorQuery) {
            movieEntries = creditsData.cast || [];
          } else {
            const directors = (creditsData.crew || []).filter((c) => c.job === "Director");
            const cast = creditsData.cast || [];
            const map = new Map();
            [...directors, ...cast].forEach((m) => {
              if (!map.has(m.id)) map.set(m.id, m);
            });
            movieEntries = Array.from(map.values());
          }

          if (genreId) {
            movieEntries = movieEntries.filter((m) =>
              Array.isArray(m.genre_ids) ? m.genre_ids.includes(genreId) : true
            );
          }

          results = movieEntries
            .map((m) => ({
              id: m.id,
              title: m.title || m.original_title || m.name,
              poster_path: m.poster_path || null,
              release_date: m.release_date || "",
              vote_average: m.vote_average || 0,
              genre_ids: m.genre_ids || [],
              popularity: m.popularity || 0,
            }))
            .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));

          meta = {
            type: genreId ? "genre+person" : "person",
            person: person.name,
            genre: foundGenre || null,
          };
        }
      }
    }

    // If not person-based, do genre or keyword search
    if (!results?.length) {
      if (genreId && !isPersonQuery) {
        const discover = await callWorker(
          "discover/movie",
          `with_genres=${genreId}&sort_by=vote_average.desc&vote_count.gte=50`
        );
        results = (discover.results || []).map((m) => ({
          id: m.id,
          title: m.title || m.original_title,
          poster_path: m.poster_path || null,
          release_date: m.release_date || "",
          vote_average: m.vote_average || 0,
          genre_ids: m.genre_ids || [],
          popularity: m.popularity || 0,
        }));
        meta = { type: "genre", genre: foundGenre };
      } else {
        const cleanQuery = query.replace(/suggest|recommend|movies?|films?|like/gi, "").trim();
        const s = await callWorker(
          "search/movie",
          `query=${encodeURIComponent(cleanQuery)}&include_adult=false&page=1`
        );
        results = (s.results || []).map((m) => ({
          id: m.id,
          title: m.title || m.original_title,
          poster_path: m.poster_path || null,
          release_date: m.release_date || "",
          vote_average: m.vote_average || 0,
          genre_ids: m.genre_ids || [],
          popularity: m.popularity || 0,
        }));

        if ((!results?.length) && cleanQuery) {
          const sm = await callWorker("search/multi", `query=${encodeURIComponent(cleanQuery)}&page=1`);
          results = (sm.results || [])
            .filter((r) => r.media_type === "movie")
            .map((m) => ({
              id: m.id,
              title: m.title || m.name || m.original_title,
              poster_path: m.poster_path || null,
              release_date: m.release_date || m.first_air_date || "",
              vote_average: m.vote_average || 0,
              genre_ids: m.genre_ids || [],
              popularity: m.popularity || 0,
            }));
        }

        meta = { type: "keyword", keyword: cleanQuery || query };
      }
    }

    results = (results || [])
      .filter(Boolean)
      .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
      .slice(0, 12);

    return res.json({ results, meta });
  } catch (err) {
    console.error("TMDB API error:", err.message);
    res.status(500).json({ error: "TMDB API error: " + err.message });
  }
});

export default router;
