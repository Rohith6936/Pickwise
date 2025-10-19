import { signup as signupService, login as loginService, savePreferences as savePreferencesService, getPreferences as getPreferencesService } from "../services/userService.js";
import { ok } from "../utils/responses.js";

// 🧩 User Signup
export const signup = async (req, res, next) => {
  try {
    const result = await signupService(req.body);
    res.status(201).json(ok(result));
  } catch (err) {
    next(err);
  }
};

// 🔐 User Login
export const login = async (req, res, next) => {
  try {
    const token = await loginService(req.body);
    res.json(ok({ token }));
  } catch (err) {
    next(err);
  }
};

// 🎯 Save Preferences (movies / music / books)
export const savePreferences = async (req, res, next) => {
  try {
    const { email, type } = req.params; // type = "movies" | "music" | "books"
    const preferencesData = req.body;

    const user = await savePreferencesService(email, type, preferencesData);
    res.json(ok({ message: `${type} preferences saved`, preferences: user.preferences[type] }));
  } catch (err) {
    next(err);
  }
};

// 🎯 Get Preferences (movies / music / books)
export const getPreferences = async (req, res, next) => {
  try {
    const { email, type } = req.params;
    const preferences = await getPreferencesService(email, type);
    res.json(ok({ preferences }));
  } catch (err) {
    next(err);
  }
};
