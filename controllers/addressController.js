// controllers/addressController.js

const Address = require('../models/Address');
const User = require('../models/User');
const Joi = require('joi');
const winston = require('winston');

// Configure Winston logger
const logger = winston.createLogger({
  level: 'error',
  transports: [
    new winston.transports.File({ filename: 'error.log' }),
    // Add more transports if needed
  ],
});

// Validation schema using Joi
const addressSchema = Joi.object({
  street: Joi.string().min(1).max(255).required(),
  city: Joi.string().min(1).max(100).required(),
  state: Joi.string().max(100).allow(''),
  postalCode: Joi.string().max(20).allow(''),
  country: Joi.string().min(1).max(100).required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  formattedAddress: Joi.string().allow(''),
  setAsActive: Joi.boolean().optional(),
});

// Add new address for a user
exports.addAddress = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = addressSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { street, city, state, postalCode, country, formattedAddress, longitude, latitude, setAsActive } = value;

    // Create a new address instance
    const newAddress = new Address({
      user_id: req.user._id,
      street,
      city,
      state: state || '',
      postalCode: postalCode || '',
      country,
      formattedAddress: formattedAddress || '',
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
    });

    // Save the new address to the database
    await newAddress.save();

    // If this is the first address, set it as active automatically
    const addressCount = await Address.countDocuments({ user_id: req.user._id, isDeleted: false });
    if (addressCount === 1) {
      await User.findByIdAndUpdate(req.user._id, { activeAddress: newAddress._id });
    }

    // Optionally set the new address as active if setAsActive is true
    if (setAsActive) {
      await User.findByIdAndUpdate(req.user._id, { activeAddress: newAddress._id });
    }

    // Respond with the newly created address
    res.status(201).json(newAddress);
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(409).json({ message: 'The address is already registered.' });
    }
    logger.error(`Error adding new address: ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all addresses for a user with pagination
exports.getAddresses = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const addresses = await Address.find({ user_id: req.user._id, isDeleted: false })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Address.countDocuments({ user_id: req.user._id, isDeleted: false });

    res.json({
      success: true,
      data: addresses,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error(`Error fetching addresses: ${error.message}`, { stack: error.stack });
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
};

// Update an address
exports.updateAddress = async (req, res) => {
  try {
    const addressId = req.params.addressId;
    const userId = req.user._id;

    // Validate request body
    const { error, value } = addressSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Prepare update data
    const updateData = {
      street: value.street,
      city: value.city,
      state: value.state || '',
      postalCode: value.postalCode || '',
      country: value.country,
      formattedAddress: value.formattedAddress || '',
      location: {
        type: 'Point',
        coordinates: [value.longitude, value.latitude],
      },
    };

    // Update the address
    const updatedAddress = await Address.findOneAndUpdate(
      { _id: addressId, user_id: userId, isDeleted: false },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedAddress) {
      return res.status(404).json({ success: false, msg: 'Address not found' });
    }

    res.json({ success: true, data: updatedAddress });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(409).json({ message: 'The updated address conflicts with an existing address.' });
    }
    logger.error(`Error updating address: ${error.message}`, { stack: error.stack });
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
};

// Delete an address with handling for active address deletion (Soft Delete)
exports.deleteAddress = async (req, res) => {
  try {
    const addressId = req.params.addressId;
    const userId = req.user._id;

    // Soft delete the address
    const address = await Address.findOneAndUpdate(
      { _id: addressId, user_id: userId, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!address) {
      return res.status(404).json({ success: false, msg: 'Address not found' });
    }

    // Check if the deleted address was the active address
    const user = await User.findById(userId);
    if (user.activeAddress && user.activeAddress.toString() === addressId) {
      // Unset the activeAddress field
      user.activeAddress = null;
      await user.save();
    }

    res.json({ success: true, msg: 'Address deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting address: ${error.message}`, { stack: error.stack });
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
};

// Set an address as active
exports.setActiveAddress = async (req, res) => {
  try {
    const { addressId } = req.body;
    const userId = req.user._id;

    if (!addressId) {
      return res.status(400).json({ error: 'Address ID is required.' });
    }

    // Verify that the address belongs to the user and is not deleted
    const address = await Address.findOne({ _id: addressId, user_id: userId, isDeleted: false });
    if (!address) {
      return res.status(404).json({ error: 'Address not found.' });
    }

    // Update the user's activeAddress field
    await User.findByIdAndUpdate(userId, { activeAddress: addressId });

    res.status(200).json({ message: 'Active address updated successfully.' });
  } catch (error) {
    logger.error(`Error setting active address: ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: 'Server error' });
  }
};
