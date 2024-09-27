// routes/address.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const addressController = require('../controllers/addressController');

// Add a new address
router.post('/add', auth, addressController.addAddress);

// Get all addresses for the authenticated user
router.get('/', auth, addressController.getAddresses);

// Update an address
router.put('/update/:addressId', auth, addressController.updateAddress);

// Delete an address
router.delete('/delete/:addressId', auth, addressController.deleteAddress);

// Set an address as active
router.post('/set-active', auth, addressController.setActiveAddress);

module.exports = router;
