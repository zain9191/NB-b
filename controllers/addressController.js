const Address = require('../models/Address');
const User = require('../models/User');

// Add new address for a user
exports.addAddress = async (req, res, next) => {
  try {
    console.log("addAddress: Start function");
    console.log("addAddress: Received user data", req.user);

    if (!req.user || !req.user._id) {
      console.warn("addAddress: No user or user_id provided", req.user);
      return res.status(401).json({ success: false, msg: 'User is not authenticated' });
    }

    console.log("addAddress: Finding user with ID", req.user._id);
    const user = await User.findById(req.user._id);
    if (!user) {
      console.warn("addAddress: User with ID not found", req.user._id);
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    console.log("addAddress: User found", user);
    console.log("addAddress: Address data received", req.body);

    const newAddress = new Address({
      user_id: req.user._id,
      ...req.body
    });

    console.log("addAddress: Saving new address", newAddress);
    await newAddress.save();
    console.log("addAddress: Address saved successfully", newAddress);

    // Fetch updated list of addresses
    const addresses = await Address.find({ user_id: req.user._id });

    res.json({ success: true, data: addresses });
  } catch (error) {
    console.error("addAddress: Error adding address", error);
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
};

// Get all addresses for a user
exports.getAddresses = async (req, res, next) => {
  try {
    console.log("getAddresses: Start function");
    console.log("getAddresses: User _id from request", req.user._id);

    const addresses = await Address.find({ user_id: req.user._id });
    console.log("getAddresses: Addresses fetched", addresses);

    res.json({ success: true, data: addresses });
  } catch (error) {
    console.error("getAddresses: Error fetching addresses", error);
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
};

// Update an address
exports.updateAddress = async (req, res, next) => {
  try {
    console.log("updateAddress: Start function");
    console.log("updateAddress: Address ID", req.params.addressId);
    console.log("updateAddress: User ID", req.user._id);
    console.log("updateAddress: Update data", req.body);

    const updatedAddress = await Address.findOneAndUpdate(
      { _id: req.params.addressId, user_id: req.user._id },
      { $set: req.body },
      { new: true }
    );

    if (!updatedAddress) {
      console.warn("updateAddress: Address not found", req.params.addressId);
      return res.status(404).json({ success: false, msg: 'Address not found' });
    }

    console.log("updateAddress: Address updated successfully", updatedAddress);

    // Fetch updated list of addresses
    const addresses = await Address.find({ user_id: req.user._id });

    res.json({ success: true, data: addresses });
  } catch (error) {
    console.error("updateAddress: Error updating address", error);
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
};

// Delete an address
exports.deleteAddress = async (req, res, next) => {
  try {
    console.log("deleteAddress: Start function");
    console.log("deleteAddress: User and Address ID", req.user._id, req.params.addressId);

    const address = await Address.findOneAndDelete({
      _id: req.params.addressId,
      user_id: req.user._id
    });

    if (!address) {
      console.warn("deleteAddress: Address not found", req.params.addressId, req.user._id);
      return res.status(404).json({ success: false, msg: 'Address not found' });
    }

    console.log("deleteAddress: Address deleted successfully", address);

    // Fetch updated list of addresses
    const addresses = await Address.find({ user_id: req.user._id });

    res.json({ success: true, data: addresses });
  } catch (error) {
    console.error("deleteAddress: Error deleting address", error);
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
};


 
