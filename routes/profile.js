 
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;  
const User = require('../models/User');
const cors = require('cors');
const bcrypt = require('bcryptjs');

// Define the uploads directory path
const uploadsDir = path.join(__dirname, '..', 'uploads');

// Asynchronously ensure uploads directory exists
const ensureUploadsDir = async () => {
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
  } catch (err) {
    console.error('Error creating uploads directory:', err.message);
    process.exit(1);  
  }
};


// Invoke the function to ensure uploads directory exists
ensureUploadsDir();

// Multer configuration for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `profilePicture-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 },  
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only .png, .jpg and .jpeg formats are allowed!'));
    }
  },
}).single('profilePicture');

// CORS middleware configuration for specific routes
router.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Upload Profile Picture Route
router.post('/upload-profile-picture', auth, (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
       console.error('Multer error:', err.message);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ msg: 'File size exceeds 5MB limit.' });
      } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ msg: err.message });
      }
      return res.status(400).json({ msg: 'File upload error.' });
    } else if (err) {
       console.error('Error uploading file:', err.message);
      return res.status(500).json({ msg: 'Server error during file upload.' });
    }

    try {
       const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

       if (user.profilePicture && user.profilePicture !== '/uploads/default-pp.png') {
        const oldPath = path.join(__dirname, '..', user.profilePicture);
        try {
          await fs.unlink(oldPath);
          console.log(`Deleted old profile picture at ${oldPath}`);
        } catch (unlinkErr) {
          console.error('Error deleting old profile picture:', unlinkErr.message);
         }
      }

       user.profilePicture = req.file
        ? `/uploads/${req.file.filename}`
        : '/uploads/default-pp.png';
      await user.save();

       res.json({
        msg: 'Profile picture updated successfully.',
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          profilePicture: user.profilePicture,
         },
      });
    } catch (saveErr) {
      console.error('Error saving user profile picture:', saveErr.message);
      res.status(500).json({ msg: 'Server error while updating profile picture.' });
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
    res.status(500).json({ msg: 'Server error while fetching profile.' });
  }
});

// Change Password Route
router.put('/change-password', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

     if (!currentPassword || !newPassword) {
      return res.status(400).json({ msg: 'Please provide both current and new passwords.' });
    }

 
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Current password is incorrect.' });
    }

 
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ msg: 'Password updated successfully.' });
  } catch (err) {
    console.error('Error changing password:', err.message);
    res.status(500).json({ msg: 'Server error while changing password.' });
  }
});

module.exports = router;
