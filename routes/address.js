// routes/address.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { addAddress, setActiveAddress, deleteAddress } = require('../controllers/addressController');

// Add new address
router.post('/add', auth, addAddress);

// Set active address
router.post('/set-active', auth, setActiveAddress);

// Delete address
router.delete('/delete/:addressId', auth, deleteAddress);

module.exports = router;
