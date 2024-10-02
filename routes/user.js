const express = require('express');
const router = express.Router();
const { registerUser, loginUser, becomeChef } = require('../controllers/userController');
const auth = require('../middleware/auth');
const mongoose = require('mongoose'); // Import mongoose for ObjectId usage

// Register route
router.post('/register', async (req, res) => {
    try {


        await registerUser(req, res);

    } catch (err) {
        console.error('Error in user registration:', err.message);
        res.status(500).send('Server error');
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
         await loginUser(req, res);
        console.log('User login successful');
    } catch (err) {
         res.status(500).send('Server error');
    }
});



module.exports = router;
