const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
  {
    meal: { 
      type: mongoose.Schema.Types.ObjectId,  
      ref: 'Meal', 
      required: true,
      index: true 
    },
    buyer: { 
      type: mongoose.Schema.Types.ObjectId,  
      ref: 'User', 
      required: true,
      index: true 
    },
    seller: { 
      type: mongoose.Schema.Types.ObjectId,   
      ref: 'User', 
      required: true,
      index: true 
    },
    amount: { 
      type: Number, 
      required: true,
      index: true  
    },
    paymentMethod: { 
      type: String, 
      required: true,
      index: true 
    },
   }, 
  { 
    timestamps: true 
  }
);
 

module.exports = mongoose.model('Transaction', TransactionSchema);
