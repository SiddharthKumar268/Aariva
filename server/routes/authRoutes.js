const express = require('express');
const router  = express.Router();
const auth    = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// ── Auth ──────────────────────────────────────
router.post('/register',    auth.register);
router.post('/login',       auth.login);
router.post('/verify-otp',  auth.verifyOTP);
router.post('/logout',      auth.logout);

// ── Session info ──────────────────────────────
router.get('/me', protect, auth.getMe);

// ── Notifications ─────────────────────────────
router.get('/notifications',        protect, auth.getNotifications);
router.patch('/notifications/read', protect, auth.markNotificationsRead);

module.exports = router;