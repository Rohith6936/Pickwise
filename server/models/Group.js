import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
  users: [String],
  sessionId: String,
});

export default mongoose.model("Group", groupSchema);
