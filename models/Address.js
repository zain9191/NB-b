// models/Address.js
const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    street: { type: String, required: true },
    city: { type: String, required: true, index: true },
    state: { type: String },
    postalCode: { type: String },
    country: { type: String, required: true, index: true },
    formattedAddress: { type: String },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Create a geospatial index on the location field
AddressSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Address', AddressSchema);
