const Meal = require('../models/Meal');



exports.createMeal = async (req, res, next) => {
  const {
    name, description, price, ingredients, category, cuisine, portionSize, nutritionalInfo,
    dietaryRestrictions, expirationDate, pickupDeliveryOptions, location, preparationDate,
    packagingInformation, healthSafetyCompliance, contactInformation, paymentOptions,
    preparationMethod, cookingInstructions, additionalNotes, tags, foodSafetyDocumentation,
    sellerRating, mealId, quantityAvailable, discountsPromotions
  } = req.body;

  const images = req.files.map(file => file.path);

  try {
    const meal = new Meal({
      name,
      description,
      price,
      ingredients: ingredients.split(','),  // Ensure ingredients are saved as an array
      images,
      createdBy: req.user._id,  // Updated field reference
      category,
      cuisine,
      portionSize,
      nutritionalInfo,
      dietaryRestrictions,
      expirationDate,
      pickupDeliveryOptions,
      location,
      preparationDate,
      packagingInformation,
      healthSafetyCompliance,
      contactInformation,
      paymentOptions: paymentOptions.split(','),  // Ensure this is saved as an array
      preparationMethod,
      cookingInstructions,
      additionalNotes,
      tags: tags.split(','),  // Ensure this is saved as an array
      foodSafetyDocumentation: foodSafetyDocumentation.split(','),
      sellerRating,
      mealId,
      quantityAvailable,
      discountsPromotions,
      timeListed: new Date(),
    });

    await meal.save();
    res.status(201).json(meal);
  } catch (err) {
    console.error('Error creating meal:', err.message);
    next(err);
  }
};





exports.getMeals = async (req, res, next) => {
  try {
    // Update this line to use createdBy querying by user_id
    const meals = await Meal.find({ createdBy: req.user._id }).populate('createdBy', 'name email');
    res.json(meals);
  } catch (err) {
    next(err);
  }
};
