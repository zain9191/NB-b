// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      default: '/uploads/default-pp.png',
    },
    accountStatus: {
      type: String,
      enum: ['Active', 'Suspended', 'Deactivated'],
      default: 'Active',
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    twoFactorEnabled: {
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
    postalCode: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ isChef: 1 });
UserSchema.index({ accountStatus: 1 });

module.exports = mongoose.model('User', UserSchema);
