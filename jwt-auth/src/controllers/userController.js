// src/controllers/userController.js
const bcrypt = require('bcryptjs');
const { users } = require('../models/store');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;

// ─── GET /profile  (any authenticated user — their own profile) ───────────────

const getProfile = (req, res) => {
  const user = users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  return res.status(200).json({
    success: true,
    data: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
};

// ─── GET /users  (admin only) ─────────────────────────────────────────────────

const getAllUsers = (req, res) => {
  const safeUsers = users.map(({ passwordHash, ...rest }) => rest);
  return res.status(200).json({ success: true, data: safeUsers });
};

// ─── GET /users/:id  (owner of that id OR admin) ─────────────────────────────

const getUserById = (req, res) => {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  const { passwordHash, ...safeUser } = user;
  return res.status(200).json({ success: true, data: safeUser });
};

// ─── PATCH /users/:id  (owner OR admin) ──────────────────────────────────────

const updateUser = async (req, res) => {
  try {
    const idx = users.findIndex((u) => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'User not found.' });

    const { username, email, password } = req.body;

    // Admins can also change roles; owners cannot elevate themselves
    const { role } = req.body;
    const allowedRoles = ['user', 'owner', 'admin'];

    if (username) users[idx].username = username;
    if (email) users[idx].email = email;
    if (password) users[idx].passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    if (role && req.user.role === 'admin' && allowedRoles.includes(role)) {
      users[idx].role = role;
    }

    const { passwordHash, ...safeUser } = users[idx];
    return res.status(200).json({ success: true, message: 'User updated.', data: safeUser });
  } catch (err) {
    console.error('[updateUser]', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ─── DELETE /users/:id  (admin only) ─────────────────────────────────────────

const deleteUser = (req, res) => {
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'User not found.' });

  users.splice(idx, 1);
  return res.status(200).json({ success: true, message: 'User deleted.' });
};

// ─── GET /admin/dashboard  (admin only) ──────────────────────────────────────

const adminDashboard = (req, res) => {
  const stats = {
    totalUsers: users.length,
    byRole: users.reduce((acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, {}),
    latestRegistration: users.length
      ? users.reduce((latest, u) =>
          new Date(u.createdAt) > new Date(latest.createdAt) ? u : latest
        ).createdAt
      : null,
  };

  return res.status(200).json({
    success: true,
    message: 'Welcome to the admin dashboard.',
    data: stats,
  });
};

// ─── GET /owner/resources  (owner OR admin) ───────────────────────────────────

const ownerResources = (req, res) => {
  return res.status(200).json({
    success: true,
    message: `Welcome, ${req.user.username}. Here are your owner resources.`,
    data: { ownerId: req.user.id, resources: ['Store A', 'Store B'] },
  });
};

module.exports = {
  getProfile,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  adminDashboard,
  ownerResources,
};
