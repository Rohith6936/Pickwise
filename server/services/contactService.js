// server/services/contactService.js
import mongoose from "mongoose";

const memoryStore = []; 
// Structure: [{ id, name, email, message, status, replyMessage, replyBy, repliedAt, createdAt, updatedAt }]

// 🧠 Check if DB is connected
export function isDbConnected() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

// 🔢 Generate unique ID for memory-based message
function genId() {
  return "mem_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// 📨 Add a new contact message to memory
export function addMemoryMessage({ name, email, message }) {
  const now = new Date().toISOString();
  const doc = {
    id: genId(),
    name,
    email,
    message,
    status: "open",
    replyMessage: "",
    replyBy: "",
    repliedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  memoryStore.unshift(doc);
  return doc;
}

// 📋 List all messages from memory
export function listMemoryMessages() {
  return memoryStore.slice();
}

// 🔍 Find message by ID
export function findMemoryMessage(id) {
  return memoryStore.find((m) => m.id === id);
}

// 🛠 Update a specific message
export function updateMemoryMessage(id, fields) {
  const idx = memoryStore.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  memoryStore[idx] = {
    ...memoryStore[idx],
    ...fields,
    updatedAt: new Date().toISOString(),
  };
  return memoryStore[idx];
}
