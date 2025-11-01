import mongoose from "mongoose";

const RecommendationSchema = new mongoose.Schema({
  email: { type: String, required: true },

  // Domain type: movies, books, music, or cross-domain
  type: { type: String, required: true }, // e.g., 'movies', 'books', 'music', 'cross-query'

  // Recommended items (with or without explanations)
  items: { type: [mongoose.Schema.Types.Mixed], default: [] },

  // Snapshot of user preferences used during generation
  preferencesSnapshot: { type: Object, default: {} }, // ✅ Added for change detection

  // Legacy field for backward compatibility
  movies: [
    {
      title: String,
      year: String,
      poster: String,
      genres: [String],
      overview: String,
    },
  ],

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Recommendation", RecommendationSchema);
