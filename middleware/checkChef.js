// File: /middleware/checkChef.js
module.exports = function (req, res, next) {
    if (req.user.role !== 'chef') {
      return res.status(403).json({ msg: 'Access denied' });
    }
    next();
  };
  