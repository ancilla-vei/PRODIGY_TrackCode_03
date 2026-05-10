// src/models/store.js
// In-memory data store (replace with a real DB like PostgreSQL/MongoDB in production)

const users = [];
const refreshTokens = new Set();

module.exports = { users, refreshTokens };
