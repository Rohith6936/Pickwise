import mongoose from "mongoose";

const logSchema = new mongoose.Schema(
  {
    email: { type: String, required: false, lowercase: true, trim: true },
    action: { type: String, required: true }, // e.g. 'login', 'signup', 'preference_update'
    meta: { type: Object, default: {} },      // optional extra info (type, ip, etc.)
    timestamp: { type: Date, default: Date.now },
  },
  {
    versionKey: false, // disables __v field
  }
);

export default mongoose.model("Log", logSchema);
