const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// GET api/profile
// Get current user profile
router.get('/', auth, async (req, res) => {
    try {
        console.log('Fetching user profile...');
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            console.log('User not found');
            return res.status(404).json({ msg: 'User not found' });
        }
        console.log('User profile fetched successfully');
        res.json(user);
    } catch (err) {
        console.error('Error in fetching user profile:', err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
