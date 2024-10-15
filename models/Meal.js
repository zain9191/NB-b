 const mongoose = require('mongoose');

// Nutritional Information Schema
const nutritionalInfoSchema = new mongoose.Schema(
  {
    calories: { type: Number },
    protein: { type: Number },
    fat: { type: Number },
    carbs: { type: Number },
    vitamins: [{ type: String }],
  },
  { _id: false }
);

// Contact Information Schema
const contactInformationSchema = new mongoose.Schema(
  {
    email: { type: String },
    phone: { type: String },
  },
  { _id: false }
);

// Meal Schema
const mealSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    ingredients: [{ type: String }],
    category: { type: String, required: true },
    cuisine: { type: String, required: true },
    portionSize: { type: String, required: true },
    nutritionalInfo: nutritionalInfoSchema,
    dietaryRestrictions: [{ type: String }],
    expirationDate: { type: Date, required: true },
    pickupDeliveryOptions: [{ type: String, required: true }],
    preparationDate: { type: Date, required: true },
    packagingInformation: { type: String },
    healthSafetyCompliance: { type: String },
    contactInformation: contactInformationSchema,
    paymentOptions: [{ type: String, required: true }],
    preparationMethod: { type: String },
    cookingInstructions: { type: String },
    additionalNotes: { type: String },
    tags: [{ type: String }],
    sellerRating: { type: Number, min: 1, max: 5, default: 1 },
    quantityAvailable: { type: Number, required: true, min: 1 },
    discountsPromotions: [{ type: String }],
    images: [{ type: String }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    address: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true },
  },
  { timestamps: true }
);

 mealSchema.index({ name: 1 });
mealSchema.index({ cuisine: 1 });

 
module.exports = mongoose.model('Meal', mealSchema);
