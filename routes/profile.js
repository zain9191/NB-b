// routes/profile.js

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
    console.log(`Uploads directory ensured at ${uploadsDir}`);
  } catch (err) {
    console.error('Error creating uploads directory:', err.message);
    process.exit(1); // Exit the application if uploads directory cannot be created
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
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `profilePicture-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// Multer upload instance with file size and type restrictions
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit
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

/**
 * @route   POST /upload-profile-picture
 * @desc    Upload and update user's profile picture
 * @access  Private
 */
router.post('/upload-profile-picture', auth, (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      // Handle Multer-specific errors
      console.error('Multer error:', err.message);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ msg: 'File size exceeds 5MB limit.' });
      } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ msg: err.message });
      }
      return res.status(400).json({ msg: 'File upload error.' });
    } else if (err) {
      // Handle unknown errors
      console.error('Unknown error uploading file:', err.message);
      return res.status(500).json({ msg: 'Server error during file upload.' });
    }

    try {
      const userId = req.user._id;

      // Fetch the current user to get existing profilePicture
      const user = await User.findById(userId).select('profilePicture');
      if (!user) {
        console.error('User not found:', userId);
        return res.status(404).json({ msg: 'User not found' });
      }

      // Delete old profile picture if it's not the default one
      if (user.profilePicture && user.profilePicture !== 'uploads/default-pp.png') {
        const oldPath = path.join(__dirname, '..', user.profilePicture);
        try {
          await fs.unlink(oldPath);
          console.log(`Deleted old profile picture at ${oldPath}`);
        } catch (unlinkErr) {
          if (unlinkErr.code !== 'ENOENT') {
            console.error('Error deleting old profile picture:', unlinkErr.message);
          } else {
            console.warn(`Old profile picture not found at ${oldPath}`);
          }
        }
      }

      // Determine the new profile picture path
      const newProfilePicture = req.file
        ? `uploads/${req.file.filename}`
        : 'uploads/default-pp.png';

      // Update the profilePicture field using findByIdAndUpdate
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { profilePicture: newProfilePicture },
        { new: true, select: '_id fullName email profilePicture' }
      );

      if (!updatedUser) {
        console.error('User not found during update:', userId);
        return res.status(404).json({ msg: 'User not found' });
      }

      res.json({
        msg: 'Profile picture updated successfully.',
        user: {
          _id: updatedUser._id,
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          profilePicture: updatedUser.profilePicture,
        },
      });
    } catch (saveErr) {
      console.error('Error saving user profile picture:', saveErr);
      res.status(500).json({ msg: 'Server error while updating profile picture.' });
    }
  });
});

/**
 * @route   GET /
 * @desc    Fetch the authenticated user's profile
 * @access  Private
 */
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

/**
 * @route   PUT /change-password
 * @desc    Change the authenticated user's password
 * @access  Private
 */
router.put('/change-password', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ msg: 'Please provide both current and new passwords.' });
    }

    // Fetch the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found.' });
    }

    // Compare current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Current password is incorrect.' });
    }

    // Hash the new password
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
