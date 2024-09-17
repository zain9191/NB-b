const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose'); // Import mongoose for ObjectId usage
const User = require('../models/User');
const cors = require('cors');

// Ensure uploads directory exists
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer configuration for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  },
}).single('profilePicture');

// CORS middleware configuration for specific routes
router.use(
  cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Upload Profile Picture Route
router.post('/upload-profile-picture', auth, (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Error uploading file:', err.message);
      return res.status(400).json({ msg: err.message });
    }
    try {
      // Find the user by MongoDB ObjectId
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      // Save profile picture path or use a default one if no file is uploaded
      user.profile_picture = req.file
        ? `/${uploadsDir}/${req.file.filename}`
        : '/uploads/default-pp.png';
      await user.save();

      // Send updated user details
      res.json(user);
    } catch (err) {
      console.error('Error saving user profile picture:', err.message);
      res.status(500).send('Server error');
    }
  });
});

// Get User Profile Route
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching user profile...');
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ msg: 'User not found' });
    }
    console.log('User profile fetched successfully');
    res.json(user);
  } catch (err) {
    console.error('Error fetching user profile:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
