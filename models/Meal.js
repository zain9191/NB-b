const mongoose = require('mongoose');

const NutritionalInfoSchema = new mongoose.Schema({
  calories: { type: Number, required: true },
  protein: { type: Number, required: true },
  fat: { type: Number, required: true },
  carbs: { type: Number, required: true },
  vitamins: { type: [String] },  
});

const MealSchema = new mongoose.Schema({
  // Removed `mealId`, relying on the default `_id` field provided by MongoDB

  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  ingredients: { type: [String], required: true },
  images: { type: [String], required: true },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, // Use ObjectId for referencing User
    ref: 'User', 
    required: true 
  },  
  date: { type: Date, default: Date.now },
  category: { type: String, required: true },  
  cuisine: { type: String, required: true },  
  portionSize: { type: String, required: true }, 
  nutritionalInfo: NutritionalInfoSchema,  
  dietaryRestrictions: { type: [String] },
  expirationDate: { type: Date, required: true },
  pickupDeliveryOptions: { type: String, required: true },
  location: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    coordinates: { 
      type: { 
        lat: Number, 
        lng: Number 
      }, 
      required: true 
    },
  },
  availabilityStatus: { type: String, enum: ['available', 'reserved', 'sold out'], default: 'available' },
  preparationDate: { type: Date, required: true },
  packagingInformation: { type: String },
  healthSafetyCompliance: { type: String },
  userReviews: [{
    userId: { 
      type: mongoose.Schema.Types.ObjectId, // Use ObjectId for referencing User
      ref: 'User' 
    }, 
    review: { type: String },
    rating: { type: Number, min: 1, max: 5 }
  }],
  contactInformation: {
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  paymentOptions: { type: [String] },
  preparationMethod: { type: String },
  cookingInstructions: { type: String },
  additionalNotes: { type: String },
  tags: { type: [String] },
  foodSafetyDocumentation: { type: [String] },
  sellerRating: { type: Number, min: 1, max: 5 },
  quantityAvailable: { type: Number, required: true },
  discountsPromotions: { type: String },
  timeListed: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Meal', MealSchema);
