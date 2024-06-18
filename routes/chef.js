// routes/chef.js


const express = require('express');
const router = express.Router();
const Chef = require('../models/Chef');
const bcrypt = require('bcryptjs');

// Register Chef
router.post('/register', async (req, res) => {
  const { name, email, password, specialty, phone, zipCode } = req.body;

  try {
    let chef = await Chef.findOne({ email });
    if (chef) {
      return res.status(400).json({ msg: 'Chef already exists' });
    }

    chef = new Chef({
      name,
      email,
      password,
      specialty,
      phone,
      zipCode,
    });

    const salt = await bcrypt.genSalt(10);
    chef.password = await bcrypt.hash(password, salt);
    await chef.save();

    res.status(201).json(chef);
  } catch (err) {
    console.error('Error during chef registration:', err.message);
    res.status(500).send('Server error');
  }
});

// Login Chef
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let chef = await Chef.findOne({ email });
    if (!chef) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, chef.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    res.status(200).json({ msg: 'Login successful', chef });
  } catch (err) {
    console.error('Error during chef login:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
