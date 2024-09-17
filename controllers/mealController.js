const Meal = require('../models/Meal');

exports.createMeal = async (req, res, next) => {
  const {
    name, description, price, ingredients, category, cuisine, portionSize, nutritionalInfo,
    dietaryRestrictions, expirationDate, pickupDeliveryOptions, location, preparationDate,
    packagingInformation, healthSafetyCompliance, contactInformation, paymentOptions,
    preparationMethod, cookingInstructions, additionalNotes, tags, foodSafetyDocumentation,
    sellerRating, quantityAvailable, discountsPromotions
  } = req.body;

  const images = req.files.map(file => file.path);

  try {
    const meal = new Meal({
      name,
      description,
      price,
      ingredients: ingredients.split(','),  
      images,
      createdBy: req.user._id,  
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
      paymentOptions: paymentOptions.split(','),  
      preparationMethod,
      cookingInstructions,
      additionalNotes,
      tags: tags.split(','), 
      foodSafetyDocumentation: foodSafetyDocumentation ? foodSafetyDocumentation.split(',') : [],
      sellerRating,
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
     const meals = await Meal.find().populate('createdBy', 'full_name email');
    res.json(meals);
  } catch (err) {
    next(err);
  }
};


exports.getMealById = async (req, res, next) => {
  try {
    const meal = await Meal.findById(req.params.id).populate('createdBy', 'full_name email');
    if (!meal) {
      return res.status(404).json({ msg: 'Meal not found' });
    }
    res.json(meal);
  } catch (err) {
    console.error('Error fetching meal by ID:', err);
    next(err);
  }
};
// exports.getMealById = getMealById;
