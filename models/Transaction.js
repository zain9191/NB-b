const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  // Removed `transactionId`, relying on the default `_id` field provided by MongoDB

  meal: { 
    type: mongoose.Schema.Types.ObjectId,  // Use ObjectId for referencing Meal
    ref: 'Meal', 
    required: true 
  },
  buyer: { 
    type: mongoose.Schema.Types.ObjectId,  // Use ObjectId for referencing User
    ref: 'User', 
    required: true 
  },
  seller: { 
    type: mongoose.Schema.Types.ObjectId,  // Use ObjectId for referencing User
    ref: 'User', 
    required: true 
  },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  transactionDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Transaction', TransactionSchema);
