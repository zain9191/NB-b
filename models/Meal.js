// models/Meal.js

const mongoose = require('mongoose');

const MealSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  cuisine: { type: String },
  ingredients: [{ type: String }],
  tags: [{ type: String }],
  dietaryRestrictions: [{ type: String }],
  paymentOptions: [{ type: String }],
  price: { type: Number, required: true },
  images: [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  address: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true },
  // Remove the location field since it's part of Address now
  // location: { ... },
}, { timestamps: true });

module.exports = mongoose.model('Meal', MealSchema);
