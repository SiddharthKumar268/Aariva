// middleware/auth.js
exports.protect = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: 'Not authenticated. Please log in.' });
  }
  next();
};

exports.requireRole = (...roles) => (req, res, next) => {
  if (!req.session?.userRole) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  if (!roles.includes(req.session.userRole)) {
    return res.status(403).json({ message: `Access denied. Required role: ${roles.join(' or ')}` });
  }
  next();
};