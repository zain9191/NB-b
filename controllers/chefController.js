// File: /controllers/chefController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Chef = require('../models/Chef');

// Register Chef
exports.registerChef = async (req, res) => {
  const { name, email, password, specialty, phone, zipCode } = req.body;
  try {
    let chef = await Chef.findOne({ email });
    if (chef) {
      return res.status(400).json({ msg: 'Chef already exists' });
    }
    chef = new Chef({ name, email, password, specialty, phone, zipCode });
    const salt = await bcrypt.genSalt(10);
    chef.password = await bcrypt.hash(password, salt);
    await chef.save();

    const token = jwt.sign(
      { user: { id: chef._id.toString(), role: 'chef' } },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log("Chef registered successfully:", chef);
    console.log("Generated token:", token);
    res.status(201).json({ token, chef });
  } catch (err) {
    console.error('Error during chef registration:', err.message);
    res.status(500).send('Server error');
  }
};

// Login Chef
exports.loginChef = async (req, res) => {
  const { email, password } = req.body;

  try {
    const chef = await Chef.findOne({ email });
    if (!chef) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, chef.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const payload = { user: { id: chef._id.toString(), role: 'chef' } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log("Chef logged in successfully:", chef);
    console.log("Generated token:", token);
    res.json({ token });
  } catch (err) {
    console.error('Error during chef login:', err.message);
    res.status(500).send('Server error');
  }
};
