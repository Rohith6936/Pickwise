// server/models/ContactMessage.js
import mongoose from "mongoose";

const ContactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "in_progress", "replied", "archived"],
      default: "open",
    },
    replyMessage: { type: String },
    replyBy: { type: String }, // admin email or id
    repliedAt: { type: Date },
  },
  { timestamps: true }
);

// ✅ Use export default for ESM
const ContactMessage = mongoose.model("ContactMessage", ContactMessageSchema);
export default ContactMessage;
