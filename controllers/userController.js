// controllers/userController.js

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Chef = require('../models/Chef');
const chefSchema = require('../validation/chefValidation.js');

// Helper function to sanitize user object
const sanitizeUser = (user) => {
  return {
    _id: user._id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    phoneNumber: user.phoneNumber,
    postalCode: user.postalCode,
    profilePicture: user.profilePicture,
    isChef: user.isChef,
    postalCode: user.postalCode,  

  };
};



// Register User
exports.registerUser = async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ msg: error.details[0].message });
    }

    // Destructure validated values
    const {
      fullName,
      username,
      email,
      password,
      phoneNumber,
      postalCode,
      profilePicture,
    } = value;

    console.log('Registering new user:', { fullName, username, email, phoneNumber });

    // Check for existing user by email or username
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      console.warn(`User with email ${email} or username ${username} already exists`);
      return res.status(400).json({ msg: 'Email or username already exists' });
    }

    // Create new user with validated data
    user = new User({
      fullName,
      username,
      email,
      password,
      phoneNumber,
      profilePicture: profilePicture || '/uploads/default-pp.png',
      postalCode,
    });

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Generate JWT Token
    const payload = {
      user: {
        _id: user._id,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Sanitize user object by removing sensitive fields
    const sanitizedUser = sanitizeUser(user);

    // Include user data in the response
    res.status(201).json({ token, user: sanitizedUser });
  } catch (err) {
    console.error('Error in registerUser:', err.message);
    next(err);
  }
};


// Login User
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Fetch user including password
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // Generate JWT Token
    const payload = {
      user: {
        _id: user._id,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Sanitize user object by removing sensitive fields
    const sanitizedUser = sanitizeUser(user);

    // Include user data in the response
    res.json({ token, user: sanitizedUser });
  } catch (err) {
    console.error('Error in loginUser:', err.message);
    res.status(500).send('Server error');
  }
};

// Become Chef
exports.becomeChef = async (req, res, next) => {
  try {
    // Validate the request body against the schema
    const { error, value } = chefSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ msg: error.details[0].message });
    }

    const { specialty } = value;

    // Fetch the user from the database and populate activeAddress
    const user = await User.findById(req.user._id).populate('activeAddress');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if the user is already a chef
    if (user.isChef) {
      return res.status(400).json({ msg: 'User is already a chef' });
    }

    // Update the user's isChef flag
    user.isChef = true;
    await user.save();


    const postalCode = user.postalCode || (user.activeAddress ? user.activeAddress.postalCode : '');


    // Create a Chef profile linked to the User
    const chef = new Chef({
      user: user._id,
      name: user.fullName,
      specialty: specialty,
      postalCode: user.activeAddress ? user.activeAddress.postalCode : '',
     });

    await chef.save();

    // Fetch the updated user data
    const updatedUser = await User.findById(user._id);

    // Sanitize updated user
    const sanitizedUpdatedUser = sanitizeUser(updatedUser);

    res.status(201).json({ msg: 'User is now a chef', user: sanitizedUpdatedUser, chef });
  } catch (err) {
    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'Chef profile already exists for this user.' });
    }

    console.error('Error converting user to chef:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get User Profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('activeAddress');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Sanitize user object
    const sanitizedUser = sanitizeUser(user);

     res.json({ user: sanitizedUser });
  } catch (err) {
    console.error('Error fetching user profile:', err.message);
    res.status(500).send('Server error');
  }
};


// Update User Profile
exports.updateUserProfile = async (req, res, next) => {
  const { fullName, username, email, phoneNumber, profilePicture } = req.body;

  try {
    // Find the user by ID
    let user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if the new email or username is already taken by another user
    let existingUser = await User.findOne({
      $or: [{ email }, { username }],
      _id: { $ne: user._id },
    });
    if (existingUser) {
      return res.status(400).json({ msg: 'Email or username already exists' });
    }

    // Update user fields
    user.fullName = fullName || user.fullName;
    user.username = username || user.username;
    user.email = email || user.email;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.profilePicture = profilePicture || user.profilePicture;

    await user.save();

    // If the user is a chef, update the Chef profile as well
    if (user.isChef) {
      let chef = await Chef.findOne({ user: user._id });
      if (chef) {
        chef.name = user.fullName;
        // No need to update email and phone as they are referenced from User
        await chef.save();
      }
    }

    // Sanitize updated user
    const sanitizedUser = sanitizeUser(user);

    res.json({ msg: 'User profile updated successfully', user: sanitizedUser });
  } catch (err) {
    console.error('Error updating user profile:', err.message);
    next(err);
  }
};
