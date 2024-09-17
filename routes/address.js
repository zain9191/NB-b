const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const Address = require('../models/Address');
const User = require('../models/User');

// Middleware to log incoming requests
router.use((req, res, next) => {
  // Uncomment the lines below to enable request logging
  // console.log(`Incoming request: ${req.method} ${req.originalUrl}`);
  // console.log('Request Headers:', req.headers);
  // console.log('Request Body:', req.body);
  next();
});

// Helper function to safely convert to ObjectId
const toObjectId = (id) => {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch (error) {
    throw new Error('Invalid ObjectId');
  }
};

// Add a new address
router.post('/add', auth, async (req, res) => {
  try {
    const userId = toObjectId(req.user._id);
    const newAddress = new Address({
      user_id: userId,
      street: req.body.street,
      city: req.body.city,
      state: req.body.state,
      postalCode: req.body.postalCode,
      country: req.body.country,
    });

    await newAddress.save();
    res.status(201).send(newAddress);
  } catch (error) {
    console.error('Error adding new address:', error);
    res.status(500).send('Server error');
  }
});

// Get all addresses for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const userId = toObjectId(req.user._id);
    const addresses = await Address.find({ user_id: userId });
    res.status(200).send(addresses);
  } catch (error) {
    console.error('Error getting addresses:', error);
    res.status(500).send('Server error');
  }
});

// Update an address
router.put('/update/:addressId', auth, async (req, res) => {
  try {
    console.log(`Route: PUT /update/${req.params.addressId} - Updating an address`);
    const addressId = toObjectId(req.params.addressId);
    const userId = toObjectId(req.user._id);

    const updatedAddress = await Address.findOneAndUpdate(
      { _id: addressId, user_id: userId },
      {
        street: req.body.street,
        city: req.body.city,
        state: req.body.state,
        postalCode: req.body.postalCode,
        country: req.body.country,
      },
      { new: true }
    );

    if (!updatedAddress) {
      return res.status(404).send('Address not found');
    }

    res.status(200).send(updatedAddress);
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).send('Server error');
  }
});

// Delete an address
router.delete('/delete/:addressId', auth, async (req, res) => {
  try {
    console.log(`Route: DELETE /delete/${req.params.addressId} - Deleting an address`);
    const addressId = toObjectId(req.params.addressId);
    const userId = toObjectId(req.user._id);

    const deletedAddress = await Address.findOneAndDelete({ _id: addressId, user_id: userId });

    if (!deletedAddress) {
      return res.status(404).send('Address not found');
    }

    res.status(200).send('Address deleted successfully');
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).send('Server error');
  }
});

// Set an address as active
router.post('/set-active', auth, async (req, res) => {
  try {
    const { addressId } = req.body;

    if (!addressId) {
      return res.status(400).json({ message: 'Address ID is required.' });
    }

    const addressObjectId = toObjectId(addressId);
    const userId = toObjectId(req.user._id);

    // Check if the address belongs to the user
    const address = await Address.findOne({ _id: addressObjectId, user_id: userId });
    if (!address) {
      return res.status(404).json({ message: 'Address not found.' });
    }

    // Update the user's activeAddress field
    await User.findByIdAndUpdate(userId, { activeAddress: addressObjectId });

    res.status(200).json({ message: 'Active address updated successfully.' });
  } catch (error) {
    console.error('Error in set-active endpoint:', error);
    res.status(500).json({ message: 'Server error occurred.' });
  }
});

// Middleware to log the response before sending it
router.use((req, res, next) => {
  const oldSend = res.send;
  res.send = function (data) {
    console.log('Response Status:', res.statusCode);
    console.log('Response Body:', data);
    oldSend.apply(res, arguments);
  };
  next();
});

module.exports = router;
