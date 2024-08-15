const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Chef = require('../models/Chef'); 

// Register User
exports.registerUser = async (req, res, next) => {
  const { name, email, password, phone, zipCode, profilePicture } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({ 
      name, 
      email, 
      password, 
      phone, 
      zipCode, 
      profilePicture: profilePicture || '/uploads/default-pp.png' 
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = { user: { id: user._id.toString(), role: 'user' } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    console.log('User registered successfully:', user);
    res.status(201).json({ token });
  } catch (err) {
    next(err);
  }
};

// Login User
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const payload = { user: { id: user._id.toString(), role: 'user' } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// become a Chef
exports.becomeChef = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.isChef) {
      return res.status(400).json({ msg: 'User is already a chef' });
    }

    // Update a user to become a chef
    user.isChef = true;
    await user.save();

    // Create a new Chef entry
    const chef = new Chef({
      name: user.name,
      email: user.email,
      password: user.password,
      specialty: req.body.specialty,
      phone: user.phone,
      zipCode: user.zipCode,
    });

    await chef.save();

    res.json({ msg: 'User is now a chef', user, chef });
  } catch (err) {
    console.error('Error converting user to chef:', err.message);
    res.status(500).send('Server error');
  }
};
