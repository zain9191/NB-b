// middleware/validateAddressId.js
const mongoose = require('mongoose');

const validateAddressId = (req, res, next) => {
  const { addressId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(addressId)) {
    return res.status(400).json({ error: 'Invalid addressId format.' });
  }
  next();
};

module.exports = validateAddressId;
