 
const Address = require('../models/Address');
const User = require('../models/User');

const getAddress = async (addressId, userId, existingMealAddressId) => {
  let address;

  if (addressId) {
     address = await Address.findOne({ _id: addressId, userId: userId, isDeleted: false });
    if (!address) {
      throw new Error('Address not found or has been deleted.');
    }
  } else if (existingMealAddressId) {
     address = await Address.findById(existingMealAddressId);
    if (!address) {
      throw new Error('Associated address not found.');
    }
  } else {
     const user = await User.findById(userId).populate('activeAddress');
    if (!user || !user.activeAddress) {
      throw new Error('Active address not set for user.');
    }
    address = user.activeAddress;
  }

  return address;
};

module.exports = { getAddress };
