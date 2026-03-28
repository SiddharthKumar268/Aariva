// ─────────────────────────────────────────────
//  Aariva · authController.js
// ─────────────────────────────────────────────

const User = require('../models/User');
const bcrypt = require('bcryptjs');

// ── POST /api/auth/login ──────────────────────

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // ✅ FIX: distinct message when user does not exist
    if (!user) {
      return res.status(401).json({
        message: 'No account found with this email. Please register first.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    // ✅ FIX: distinct message when password is wrong
    if (!isMatch) {
      return res.status(401).json({
        message: 'Incorrect password. Please try again.'
      });
    }

    req.session.pendingUserId = user._id.toString();
    req.session.pendingEmail  = user.email;

    return res.status(200).json({
      message: 'Credentials verified. OTP sent.',
      role: user.role,
      name: user.name
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// ── POST /api/auth/verify-otp ─────────────────

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otpVerified } = req.body;

    if (!otpVerified) {
      return res.status(400).json({ message: 'OTP verification failed.' });
    }

    if (!req.session.pendingUserId || req.session.pendingEmail !== email) {
      return res.status(401).json({ message: 'Session mismatch. Please login again.' });
    }

    const user = await User.findById(req.session.pendingUserId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    req.session.userId   = user._id.toString();
    req.session.userRole = user.role;
    req.session.userName = user.name;

    delete req.session.pendingUserId;
    delete req.session.pendingEmail;

    return res.status(200).json({
      message: 'Login successful.',
      role: user.role,
      name: user.name
    });

  } catch (err) {
    console.error('OTP verify error:', err);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// ── GET /api/auth/me ──────────────────────────

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    res.json({
      id:    user._id,
      name:  user.name,
      email: user.email,
      role:  user.role
    });
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ── GET /api/auth/notifications ───────────────

exports.getNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select('notifications');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const notifications = (user.notifications || [])
      .slice()
      .reverse()
      .slice(0, 20);

    res.json({ notifications });
  } catch (err) {
    console.error('getNotifications error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ── PATCH /api/auth/notifications/read ────────

exports.markNotificationsRead = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.session.userId, {
      $set: { 'notifications.$[].read': true }
    });
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('markNotificationsRead error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ── POST /api/auth/logout ─────────────────────

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: 'Logout failed.' });
    res.clearCookie('connect.sid');
    return res.status(200).json({ message: 'Logged out.' });
  });
};

// ── POST /api/auth/register ───────────────────

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const allowedRoles = ['applicant', 'caseworker', 'doctor', 'admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    await User.create({
      name,
      email: email.toLowerCase(),
      password, // pre-save hook in User.js hashes this
      role
    });

    return res.status(201).json({ message: 'Account created successfully.' });

  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};
