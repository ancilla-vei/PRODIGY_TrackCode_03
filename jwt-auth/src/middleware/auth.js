// src/middleware/auth.js
const { verifyAccessToken } = require('../utils/jwt');
const { users } = require('../models/store');

/**
 * authenticate — verifies the Bearer token and attaches the user to req.user
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);

    // Attach fresh user data from store (so revoked users are caught)
    const user = users.find((u) => u.id === decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    // Expose a safe user object — never attach the full record (contains passwordHash)
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

/**
 * authorize — role-based access control factory
 * Usage: authorize('admin') or authorize('admin', 'owner')
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}.`,
      });
    }

    next();
  };
};

/**
 * ownerOrAdmin — allows access if the requesting user owns the resource OR is an admin.
 * Compares req.user.id with req.params.id
 */
const ownerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }

  const isOwner = req.user.id === req.params.id;
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own resources.',
    });
  }

  next();
};

module.exports = { authenticate, authorize, ownerOrAdmin };
