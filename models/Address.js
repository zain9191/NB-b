// models/Address.js
const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String }, // Optional
    postalCode: { type: String }, // Optional
    country: { type: String, required: true },
    formattedAddress: { type: String },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    isDeleted: { type: Boolean, default: false }, // Newly added field
  },
  {
    timestamps: true,
  }
);

// Create a geospatial index on the location field
AddressSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Address', AddressSchema);
