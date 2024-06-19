const User = require('../models/User');

exports.addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.addresses.push(req.body);
    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.setActiveAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const address = user.addresses.id(req.body.addressId);
    if (!address) {
      return res.status(404).json({ msg: 'Address not found' });
    }
    user.activeAddress = address;
    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};


exports.deleteAddress = async (req, res) => {
  try {
    console.log('Attempting to delete address...');
    console.log('User ID:', req.user.id);
    console.log('Address ID:', req.params.addressId);
    
    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ msg: 'User not found' });
    }

    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      console.log('Address not found');
      return res.status(404).json({ msg: 'Address not found' });
    }
    
    user.addresses.pull(req.params.addressId); // Use the pull method to remove the address
    await user.save(); 
    
    console.log('Address deleted successfully');
    res.json(user); 
  } catch (err) {
    console.error('Error in deleting address:', err.message);
    res.status(500).send('Server error');
  }
};
