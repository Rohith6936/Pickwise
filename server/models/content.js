import mongoose from "mongoose";

const contentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    genre: { type: String, default: "" },
    description: { type: String, default: "" },
    // Fields used by admin pages
    type: { type: String, default: "" },
    category: { type: String, default: "" },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
  },
  { timestamps: true }
);

export default mongoose.model("Content", contentSchema);