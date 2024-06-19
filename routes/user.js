const express = require('express');
const router = express.Router();
const { registerUser, loginUser, becomeChef } = require('../controllers/userController');
const auth = require('../middleware/auth');


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

// become a chef
router.post('/become-chef', auth, async (req, res) => {
    try {
        console.log('User becoming chef...');
        await becomeChef(req, res);
        console.log('User is now a chef');
    } catch (err) {
        console.error('Error in becoming chef:', err.message);
        res.status(500).send('Server error');
    }
});


module.exports = router;
