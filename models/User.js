// models/User.js

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  full_name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    unique: true,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone_number: {
    type: String,
    required: true,
  },
  profile_picture: {
    type: String,
    default: '/uploads/default-pp.png',
  },
  account_status: {
    type: String,
    enum: ['Active', 'Suspended', 'Deactivated'],
    default: 'Active',
  },
  email_verified: {
    type: Boolean,
    default: false,
  },
  phone_verified: {
    type: Boolean,
    default: false,
  },
  two_factor_enabled: {
    type: Boolean,
    default: false,
  },
  activeAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address',
  },
  isChef: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to update the `updated_at` field automatically
UserSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

// Pre-update hook to update the `updated_at` field automatically
UserSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updated_at: Date.now() });
  next();
});

module.exports = mongoose.model('User', UserSchema);
