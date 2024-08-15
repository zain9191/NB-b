const User = require('../models/User');

// addressController
exports.addAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const newAddress = req.body;
    user.addresses.push(newAddress);

    // Automatically set as active if no active address is set
    if (!user.activeAddress) {
      user.activeAddress = newAddress;
    }

    await user.save();
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};


exports.setActiveAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const address = user.addresses.id(req.body.addressId);
    if (!address) {
      return res.status(404).json({ success: false, msg: 'Address not found' });
    }

    user.activeAddress = address;
    await user.save();
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

exports.deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      return res.status(404).json({ success: false, msg: 'Address not found' });
    }

    user.addresses.pull(req.params.addressId);

    // Check if the deleted address was the active one
    if (user.activeAddress && user.activeAddress._id.equals(req.params.addressId)) {
      if (user.addresses.length > 0) {
        user.activeAddress = user.addresses[0]; // Set first address as active
      } else {
        user.activeAddress = null; // No addresses left, reset activeAddress
      }
    }

    await user.save();
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};


exports.updateAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.addressId;

    console.log(`User ID: ${userId}, Address ID: ${addressId}`);

    const user = await User.findById(userId);
    if (!user) {
      console.log(`User not found: ${userId}`);
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    console.log(`User found: ${user._id}`);

    const address = user.addresses.id(addressId);
    if (!address) {
      console.log(`Address not found: ${addressId}`);
      return res.status(404).json({ success: false, msg: 'Address not found' });
    }

    console.log(`Address found: ${address._id}`);

    // Update the address fields
    Object.assign(address, req.body);

    await user.save();
    res.json({ success: true, data: user });
  } catch (err) {
    console.error(`Error in updateAddress: ${err}`);
    next(err);
  }
};
