// models/User.js

const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.methods.generateAuthToken = function() {
  return jwt.sign({ userId: this._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

module.exports = mongoose.model("User", UserSchema);
