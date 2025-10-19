import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// 🧩 USER SIGNUP
export const signup = async ({ name, email, password, role }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Error("User already exists");

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ name, email, password: hashedPassword, role });
  await user.save();

  return { id: user._id, name: user.name, email: user.email, role: user.role };
};

// 🔐 USER LOGIN
export const login = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid credentials");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid credentials");

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  return token;
};

// 🎯 SAVE PREFERENCES — supports movies, music, and books
export const savePreferences = async (email, type, preferencesData) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");

  // ✅ Validate the type
  if (!["movies", "music", "books"].includes(type)) {
    throw new Error("Invalid preference type");
  }

  // ✅ Safely update only the selected type
  user.preferences[type] = {
    genres: preferencesData.genres || [],
    era: preferencesData.era || "",
    favorites: preferencesData.favorites || [],
  };

  await user.save();
  return user;
};

// 📖 GET PREFERENCES — for a specific category
export const getPreferences = async (email, type) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");

  // ✅ Validate the type
  if (!["movies", "music", "books"].includes(type)) {
    throw new Error("Invalid preference type");
  }

  return user.preferences[type] || {};
};
