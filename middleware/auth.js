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
      return res.status(401).json({
        message: 'Invalid or expired token',
        code: 'TOKEN_INVALID'
      });
    }

    const user = await User.findById(decoded.userId).select(
      '_id role status isActive mustChangePassword isHiddenAdmin parentAdminId'
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

    req.userId = user._id;
    req.role = user.role;
    req.isHiddenAdmin = user.isHiddenAdmin || false;
    req.isOwner = user.role === 'admin' && !user.parentAdminId;
    req.parentAdminId = user.parentAdminId || user._id;
    req.tenantId = user.parentAdminId || user._id;
    req.mustChangePassword = user.mustChangePassword || false;

    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({ message: 'Authentication failed', code: 'AUTH_FAILED' });
  }
};