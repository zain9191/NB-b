const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { addAddress, setActiveAddress } = require('../controllers/addressController');

// Add new address
router.post('/add', auth, async (req, res) => {
    try {
        console.log('Attempting to add new address...');
        await addAddress(req, res);
        console.log('Address added successfully');
    } catch (err) {
        console.error('Error in adding address:', err.message);
        res.status(500).send('Server error');
    }
});

// Set active address
router.post('/set-active', auth, async (req, res) => {
    try {
        console.log('Attempting to set active address...');
        await setActiveAddress(req, res);
        console.log('Active address set successfully');
    } catch (err) {
        console.error('Error in setting active address:', err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
