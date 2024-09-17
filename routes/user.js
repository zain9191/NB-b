const express = require('express');
const router = express.Router();
const { registerUser, loginUser, becomeChef } = require('../controllers/userController');
const auth = require('../middleware/auth');
const mongoose = require('mongoose'); // Import mongoose for ObjectId usage

// Register route
router.post('/register', async (req, res) => {
    try {
        console.log('Attempting user registration...');
        console.log("__________________________________")
        console.log("req is: " ,req)
        console.log("res is : " ,res)

        await registerUser(req, res);
        console.log("req is: " ,req)
        console.log("res is : " ,res)

        console.log("__________________________________")
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

// Become a chef route
router.post('/become-chef', auth, async (req, res) => {
    try {
        console.log('User becoming chef...');
        // Attach MongoDB ObjectId to the request body before passing to the controller
        req.body.user_id = mongoose.Types.ObjectId(req.user._id); // Use MongoDB ObjectId
        await becomeChef(req, res);
        console.log('User is now a chef');
    } catch (err) {
        console.error('Error in becoming chef:', err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
