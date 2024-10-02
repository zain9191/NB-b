const mongoose = require('mongoose');

const ChefSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // Ensures one-to-one relationship
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  specialty: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  postalCode: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Chef', ChefSchema);
