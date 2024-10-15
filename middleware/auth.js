 const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

   if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication failed.' });
  }

   const token = authHeader.split(' ')[1];

  try {
     const decoded = jwt.verify(token, process.env.JWT_SECRET);

     const userId = decoded.user._id;

     req.user = await User.findById(userId);

     if (!req.user) {
      return res.status(401).json({ message: 'Authentication failed.' });
    }

     next();
  } catch (error) {
     console.error('Error in authentication middleware:', error);

     if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please log in again.' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token. Authentication failed.' });
    } else {
       return res.status(401).json({ message: 'Authentication failed.' });
    }
  }
};

module.exports = authenticateUser;
