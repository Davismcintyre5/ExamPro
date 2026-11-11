module.exports = async (req, res, next) => {
  if (!req.isHiddenAdmin) {
    return res.status(403).json({ 
      message: 'Only super admin can access platform settings' 
    });
  }
  next();
};