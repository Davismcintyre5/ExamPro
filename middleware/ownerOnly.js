module.exports = (req, res, next) => {
  if (!req.isOwner) {
    return res.status(403).json({
      message: 'Only account owner can perform this action'
    });
  }
  next();
};