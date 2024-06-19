// routes/profile.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const cors = require('cors');

// Ensure uploads directory exists
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
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
  }
}).single('profilePicture');

// Add CORS for specific routes if needed
router.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

router.post('/upload-profile-picture', auth, (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Error uploading file:', err.message);
      return res.status(400).json({ msg: err.message });
    }
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
      user.profilePicture = `/${uploadsDir}/${req.file.filename}`;
      await user.save();
      res.json(user);
    } catch (err) {
      console.error('Error saving user profile picture:', err.message);
      res.status(500).send('Server error');
    }
  });
});

router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching user profile...');
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ msg: 'User not found' });
    }
    console.log('User profile fetched successfully');
    res.json(user);
  } catch (err) {
    console.error('Error in fetching user profile:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
