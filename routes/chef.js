// File: /routes/chef.js
const express = require('express');
const router = express.Router();
const { registerChef, loginChef } = require('../controllers/chefController');
const checkChef = require('../middleware/checkChef');

// Route to register a new chef
router.post('/register', registerChef);

// Route to login a chef
router.post('/login', loginChef);

module.exports = router;
