// models/User.js
const mongoose = require("mongoose");

const AddressSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  addressLine: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true },
});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  zipCode: { type: String, required: true },
  addresses: [AddressSchema],
  activeAddress: AddressSchema,
  isChef: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
  profilePicture: {
    type: String,
    default: '/uploads/default-pp.png', // Path to default profile picture
  },
});

module.exports = mongoose.model("User", UserSchema);
