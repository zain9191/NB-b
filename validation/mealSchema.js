const Joi = require('joi');
const mealSchema = Joi.object({
    name: Joi.string().min(1).max(255).required(),
    description: Joi.string().min(1).required(),
    price: Joi.number().min(0).required(),
    ingredients: Joi.alternatives().try(
      Joi.array().items(Joi.string().trim().min(1)),
      Joi.string().trim().min(1)
    ).required(),
    category: Joi.string().min(1).max(100).required(),
    cuisine: Joi.string().min(1).max(100).required(),
    portionSize: Joi.string().min(1).max(100).required(),
    nutritionalInfo: Joi.object({
      calories: Joi.number().min(0),
      protein: Joi.number().min(0),
      fat: Joi.number().min(0),
      carbs: Joi.number().min(0),
      vitamins: Joi.alternatives().try(
        Joi.array().items(Joi.string().trim().min(1)),
        Joi.string().trim().min(1)
      ).optional(),
    }).optional(),
    dietaryRestrictions: Joi.alternatives().try(
      Joi.array().items(Joi.string().trim().min(1)),
      Joi.string().trim().min(1)
    ).optional(),
    expirationDate: Joi.date().required(),
    pickupDeliveryOptions: Joi.alternatives().try(
      Joi.array().items(Joi.string().trim().min(1)),
      Joi.string().trim().min(1)
    ).required(),
    preparationDate: Joi.date().required(),
    packagingInformation: Joi.string().allow(''),
    healthSafetyCompliance: Joi.string().allow(''),
    contactInformation: Joi.object({
      email: Joi.string().email(),
      phone: Joi.string().pattern(/^[0-9]{10,15}$/).message('Please enter a valid phone number.'),
    }).optional(),
    paymentOptions: Joi.alternatives().try(
      Joi.array().items(Joi.string().trim().min(1)),
      Joi.string().trim().min(1)
    ).required(),
    preparationMethod: Joi.string().allow(''),
    cookingInstructions: Joi.string().allow(''),
    additionalNotes: Joi.string().allow(''),
    tags: Joi.alternatives().try(
      Joi.array().items(Joi.string().trim().min(1)),
      Joi.string().trim().min(1)
    ).required(),
    sellerRating: Joi.number().min(1).max(5).optional(),
    quantityAvailable: Joi.number().min(1).required(),
    discountsPromotions: Joi.alternatives().try(
      Joi.array().items(Joi.string().trim().min(1)),
      Joi.string().trim().min(1)
    ).optional(),
    addressId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  });
  
  module.exports = mealSchema;
