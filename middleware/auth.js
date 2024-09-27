// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// In middleware/auth.js
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token is missing.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.user._id;
    req.user = await User.findById(userId);

    if (!req.user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    // console.log('Authenticated User:', req.user); // Add this line

    next();
  } catch (error) {
    console.error('Error in authentication middleware:', error);
    res.status(401).json({ message: 'Invalid token.' });
  }
};

module.exports = authenticateUser;
