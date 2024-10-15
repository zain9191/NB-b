// controllers/addressController.js
const mongoose = require('mongoose');
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

// Validation schemas using Joi
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

const idSchema = Joi.object({
  addressId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
});

// Add new address for a user
exports.addAddress = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = addressSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const {
      street,
      city,
      state,
      postalCode,
      country,
      formattedAddress,
      longitude,
      latitude,
      setAsActive,
    } = value;

    // Create a new address instance
    const newAddress = new Address({
      userId: req.user._id,
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
    const addressCount = await Address.countDocuments({
      userId: req.user._id,
      isDeleted: false,
    });
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
    logger.error(`Error adding new address: ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: 'Server error' });
  }
};

// Get address by ID
exports.getAddressById = async (req, res) => {
  try {
    const { addressId } = req.params;

    // Validate addressId
    const { error } = idSchema.validate({ addressId });
    if (error) {
      return res.status(400).json({ error: 'Invalid address ID format.' });
    }

    const address = await Address.findOne({
      _id: addressId,
      userId: req.user._id,
      isDeleted: false,
    }).lean(); // Use lean() for better performance

    if (!address) {
      return res.status(404).json({ error: 'Address not found.' });
    }

    res.status(200).json({ success: true, data: address });
  } catch (error) {
    logger.error(`Error fetching address by ID: ${error.message}`, { stack: error.stack });
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Get all addresses for a user with pagination
exports.getAddresses = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Validate pagination parameters
    const paginationSchema = Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
    });

    const { error, value } = paginationSchema.validate({ page, limit });
    if (error) {
      return res.status(400).json({ error: 'Invalid pagination parameters.' });
    }

    const { page: validPage, limit: validLimit } = value;

    const addresses = await Address.find({ userId: req.user._id, isDeleted: false })
      .skip((validPage - 1) * validLimit)
      .limit(validLimit)
      .lean(); // Use lean() for better performance

    const total = await Address.countDocuments({ userId: req.user._id, isDeleted: false });

    res.status(200).json({
      success: true,
      data: addresses,
      pagination: {
        total,
        page: validPage,
        limit: validLimit,
        totalPages: Math.ceil(total / validLimit),
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

    // Validate addressId
    const { error: idError } = idSchema.validate({ addressId });
    if (idError) {
      return res.status(400).json({ error: 'Invalid address ID format.' });
    }

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
      { _id: addressId, userId: userId, isDeleted: false },
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean(); // Use lean() if you don't need Mongoose document methods

    if (!updatedAddress) {
      return res.status(404).json({ success: false, msg: 'Address not found.' });
    }

    // Handle setAsActive parameter
    if (value.setAsActive) {
      await User.findByIdAndUpdate(userId, { activeAddress: addressId });
    }

    res.status(200).json({ success: true, data: updatedAddress });
  } catch (error) {
    logger.error(`Error updating address: ${error.message}`, { stack: error.stack });
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
};

// Delete an address with handling for active address deletion (Soft Delete)
exports.deleteAddress = async (req, res) => {
  try {
    const addressId = req.params.addressId;
    const userId = req.user._id;

    // Validate addressId
    const { error: idError } = idSchema.validate({ addressId });
    if (idError) {
      return res.status(400).json({ error: 'Invalid address ID format.' });
    }

    // Soft delete the address
    const address = await Address.findOneAndUpdate(
      { _id: addressId, userId: userId, isDeleted: false },
      { isDeleted: true },
      { new: true }
    ).lean(); // Use lean() if you don't need Mongoose document methods

    if (!address) {
      return res.status(404).json({ success: false, msg: 'Address not found.' });
    }

    // Check if the deleted address was the active address
    const user = await User.findById(userId).lean();
    if (user.activeAddress && user.activeAddress.toString() === addressId) {
      // Unset the activeAddress field
      await User.findByIdAndUpdate(userId, { activeAddress: null });

      // Optionally, set another address as active if available
      const anotherAddress = await Address.findOne({ userId: userId, isDeleted: false }).lean();
      if (anotherAddress) {
        await User.findByIdAndUpdate(userId, { activeAddress: anotherAddress._id });
      }
    }

    res.status(200).json({ success: true, msg: 'Address deleted successfully.' });
  } catch (error) {
    logger.error(`Error deleting address: ${error.message}`, { stack: error.stack });
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
};

// Set an address as active
exports.setActiveAddress = async (req, res) => {
  try {
    const { addressId } = req.params; // Ensure addressId is taken from params
    const userId = req.user._id;

    // Validate addressId
    const { error: idError } = idSchema.validate({ addressId });
    if (idError) {
      return res.status(400).json({ error: 'Invalid address ID format.' });
    }

    // Verify that the address belongs to the user and is not deleted
    const address = await Address.findOne({ _id: addressId, userId: userId, isDeleted: false }).lean();
    if (!address) {
      return res.status(404).json({ error: 'Address not found.' });
    }

    // Update the user's activeAddress field
    await User.findByIdAndUpdate(userId, { activeAddress: addressId });

    res.status(200).json({ message: 'Active address updated successfully.' });
  } catch (error) {
    logger.error(`Error setting active address: ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: 'Server error.' });
  }
};
