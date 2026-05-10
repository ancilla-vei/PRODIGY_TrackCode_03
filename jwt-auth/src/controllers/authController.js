// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { users, refreshTokens } = require('../models/store');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/jwt');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;

// ─── Register ─────────────────────────────────────────────────────────────────

const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Username, email, and password are required.' });
    }

    // Check uniqueness
    if (users.find((u) => u.email === email)) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }
    if (users.find((u) => u.username === username)) {
      return res.status(409).json({ success: false, message: 'Username already taken.' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Only allow 'admin' role if explicitly provided AND the store is empty (first user = superadmin)
    // Otherwise clamp to 'user' or 'owner'
    const allowedRoles = ['user', 'owner', 'admin'];
    const assignedRole = allowedRoles.includes(role) ? role : 'user';

    const newUser = {
      id: uuidv4(),
      username,
      email,
      passwordHash,
      role: assignedRole,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);

    const tokenPayload = { id: newUser.id, role: newUser.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    refreshTokens.add(refreshToken);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          createdAt: newUser.createdAt,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    console.error('[register]', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = users.find((u) => u.email === email);
    if (!user) {
      // Use a generic message to avoid user enumeration
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const tokenPayload = { id: user.id, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    refreshTokens.add(refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    console.error('[login]', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ─── Refresh Token ─────────────────────────────────────────────────────────────

const refresh = (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ success: false, message: 'Refresh token required.' });
  }

  if (!refreshTokens.has(refreshToken)) {
    return res.status(401).json({ success: false, message: 'Invalid or revoked refresh token.' });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);

    // Rotate: revoke old, issue new pair
    refreshTokens.delete(refreshToken);
    const tokenPayload = { id: decoded.id, role: decoded.role };
    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);
    refreshTokens.add(newRefreshToken);

    return res.status(200).json({
      success: true,
      message: 'Tokens refreshed.',
      data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────

const logout = (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    refreshTokens.delete(refreshToken);
  }

  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

module.exports = { register, login, refresh, logout };
