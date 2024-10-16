// routes/auth.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  registerUser,
  loginUser,
  becomeChef,
  getUserProfile,
  updateUserProfile,
} = require('../controllers/userController');

// GET /api/auth - Fetch the authenticated user's details
router.get('/', auth, getUserProfile);

// Register user
router.post('/register', registerUser);

// Authenticate user & get token
router.post('/login', loginUser);

// Update User Profile
router.put('/', auth, updateUserProfile);

// Become a chef route
router.post('/become-chef', auth, becomeChef);



module.exports = router;
