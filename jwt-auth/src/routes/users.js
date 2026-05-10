// src/routes/users.js
const express = require('express');
const { authenticate, authorize, ownerOrAdmin } = require('../middleware/auth');
const {
  getProfile,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  adminDashboard,
  ownerResources,
} = require('../controllers/userController');

const router = express.Router();

// All routes in this file require authentication
router.use(authenticate);

// ─── Profile (any authenticated user) ────────────────────────────────────────
router.get('/profile', getProfile);

// ─── Admin dashboard (admin only) ────────────────────────────────────────────
router.get('/admin/dashboard', authorize('admin'), adminDashboard);

// ─── Owner resources (owner OR admin) ────────────────────────────────────────
router.get('/owner/resources', authorize('owner', 'admin'), ownerResources);

// ─── User CRUD ────────────────────────────────────────────────────────────────
router.get('/users', authorize('admin'), getAllUsers);
router.get('/users/:id', ownerOrAdmin, getUserById);
router.patch('/users/:id', ownerOrAdmin, updateUser);
router.delete('/users/:id', authorize('admin'), deleteUser);

module.exports = router;
