// controllers/chefController.js
const Chef = require('../models/Chef');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register Chef
exports.registerChef = async (req, res) => {
  const { name, email, password, specialty } = req.body;

  try {
    let chef = await Chef.findOne({ email });
    if (chef) {
      return res.status(400).json({ msg: 'Chef already exists' });
    }

    chef = new Chef({ name, email, password, specialty });

    const salt = await bcrypt.genSalt(10);
    chef.password = await bcrypt.hash(password, salt);

    await chef.save();

    const payload = { chef: { id: chef.id } };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000 }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error(err.message);
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

    const payload = { chef: { id: chef.id } };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000 }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
