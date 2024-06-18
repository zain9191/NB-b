const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/userController');

// Register route
router.post('/register', async (req, res) => {
    try {
        console.log('Attempting user registration...');
        await registerUser(req, res);
        console.log('User registration successful');
    } catch (err) {
        console.error('Error in user registration:', err.message);
        res.status(500).send('Server error');
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        console.log('Attempting user login...');
        await loginUser(req, res);
        console.log('User login successful');
    } catch (err) {
        console.error('Error in user login:', err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
