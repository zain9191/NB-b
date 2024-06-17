const express = require('express');
const router = express.Router();
const Chef = require('../models/Chef');
const bcrypt = require('bcryptjs');

// Register Chef
router.post('/register', async (req, res) => {
  const { name, email, password, specialty } = req.body;

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

module.exports = router;
