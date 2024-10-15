 module.exports = (requiredRole) => (req, res, next) => {
  if (requiredRole === 'chef') {
    if (!req.user.isChef) {
      return res.status(403).json({ msg: 'Access denied' });
    }
  }
  next();
};
