const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
  latitude: { type: Number },
  longitude: { type: Number },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Address', AddressSchema);
