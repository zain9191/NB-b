const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Chef = require('../models/Chef');
const chefSchema = require('../validation/chefValidation.jsx');

// Register User
exports.registerUser = async (req, res, next) => {
  const { full_name, username, email, password, phone_number } = req.body;

  try {
    console.log('Registering new user:', { full_name, username, email, phone_number });

    let user = await User.findOne({ email });
    if (user) {
      console.warn(`User with email ${email} already exists`);
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      full_name,
      username,
      email,
      password,
      phone_number,
      // address_id,
      profile_picture: req.body.profile_picture || '/uploads/default-pp.png'
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      user: {
        _id: user._id,  // Use MongoDB's ObjectId (_id)
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ token });
  } catch (err) {
    console.error('Error in registerUser:', err.message);
    next(err);
  }
};

// Login User
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const payload = { 
      user: { 
        _id: user._id  // Use MongoDB's ObjectId (_id)
      } 
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
  } catch (err) {
    console.error('Error in loginUser:', err.message);
    res.status(500).send('Server error');
  }
};

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

    // Create a Chef profile linked to the User
    const chef = new Chef({
      user: user._id,
      name: user.full_name,
      email: user.email,
      specialty: specialty,
      phone: user.phone_number,
      postalCode: user.activeAddress ? user.activeAddress.postalCode : '',
    });

    await chef.save();

    // Fetch the updated user data
    const updatedUser = await User.findById(user._id);

    res.status(201).json({ msg: 'User is now a chef', user: updatedUser, chef });
  } catch (err) {
    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'Chef profile already exists for this user.' });
    }

    console.error('Error converting user to chef:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};



// getUserProfile

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('activeAddress');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error fetching user profile:', err.message);
    res.status(500).send('Server error');
  }
};
