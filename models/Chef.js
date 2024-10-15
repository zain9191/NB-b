const mongoose = require('mongoose');

const ChefSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    specialty: {
      type: String,
      required: true,
      index: true,
    },
    postalCode: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Chef', ChefSchema);
