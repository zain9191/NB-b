const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Chef = require('../models/Chef');

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

// become a Chef
exports.becomeChef = async (req, res, next) => {
  try {
    console.log('Converting user to chef with user ID:', req.user._id);

    const user = await User.findById(req.user._id);  // Use MongoDB's ObjectId (_id)
    if (!user) {
      console.warn(`User with ID ${req.user._id} not found`);
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.isChef) {
      console.warn(`User with ID ${req.user._id} is already a chef`);
      return res.status(400).json({ msg: 'User is already a chef' });
    }

    console.log('Updating user to become a chef');
    user.isChef = true;
    await user.save();

    console.log('Creating new Chef record');
    const chef = new Chef({
      name: user.full_name,
      email: user.email,
      password: user.password,
      specialty: req.body.specialty,
      phone: user.phone_number,
      // zipCode: user.address_id  // Assuming `address_id` refers to the address zip code or similar
    });

    await chef.save();

    console.log('User successfully converted to chef:', { user, chef });
    res.json({ msg: 'User is now a chef', user, chef });
  } catch (err) {
    console.error('Error converting user to chef:', err.message);
    res.status(500).send('Server error');
  }
};
