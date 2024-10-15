 const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const addressController = require('../controllers/addressController');
const validateAddressId = require('../middleware/validateAddressId'); 

// Create a new address
router.post('/', auth, addressController.addAddress);

// Get all addresses for the authenticated user
router.get('/', auth, addressController.getAddresses);

// Get a specific address by ID
router.get('/:addressId', auth, validateAddressId, addressController.getAddressById);

// Update a specific address by ID
router.put('/:addressId', auth, validateAddressId, addressController.updateAddress);

// Delete a specific address by ID
router.delete('/:addressId', auth, validateAddressId, addressController.deleteAddress);

// Set an address as active
router.patch('/:addressId/active', auth, validateAddressId, addressController.setActiveAddress);

module.exports = router;
