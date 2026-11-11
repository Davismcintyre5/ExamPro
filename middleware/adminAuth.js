const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      console.error('Token verification failed:', error.message);
      return res.status(401).json({
        message: 'Invalid or expired token. Please login again.',
        code: 'TOKEN_INVALID'
      });
    }

    if (decoded.role !== 'admin' && decoded.role !== 'staff' && !decoded.isHiddenAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(decoded.userId).select(
      '_id role status isActive mustChangePassword isHiddenAdmin parentAdminId departments'
    );

    if (!user) {
      return res.status(401).json({ message: 'User not found', code: 'AUTH_FAILED' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is inactive', code: 'INACTIVE' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        message: `Account is ${user.status}`,
        code: user.status.toUpperCase()
      });
    }

    if (user.mustChangePassword && !req.path.includes('change-password')) {
      return res.status(403).json({
        message: 'You must change your password before continuing',
        code: 'MUST_CHANGE_PASSWORD'
      });
    }

    req.userId = user._id;
    req.role = user.role;
    req.isHiddenAdmin = user.isHiddenAdmin || false;
    req.isOwner = user.role === 'admin' && !user.parentAdminId;
    req.parentAdminId = user.parentAdminId || user._id;
    req.tenantId = user.parentAdminId || user._id;
    req.isAdmin = true;

    if (user.role === 'staff' && user.departments && user.departments.length > 0) {
      req.departments = user.departments.map((d) => d.toString());
    } else {
      req.departments = null;
    }

    next();
  } catch (error) {
    console.error('Admin auth error:', error.message);
    res.status(401).json({ message: 'Authentication failed', code: 'AUTH_FAILED' });
  }
};