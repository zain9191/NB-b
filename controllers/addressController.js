const User = require('../models/User');

// controllers/addressController.js
exports.addAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    user.addresses.push(req.body);
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
    await user.save();
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};
