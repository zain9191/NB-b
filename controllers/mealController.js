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
    const meal = await Meal.findById(req.params.id).populate('createdBy', '_id full_name email');
    if (!meal) {
      return res.status(404).json({ msg: 'Meal not found' });
    }
    res.json(meal);
  } catch (err) {
    console.error('Error fetching meal by ID:', err);
    next(err);
  }
};
exports.updateMeal = async (req, res, next) => {
  const mealId = req.params.id;
  const userId = req.user._id;

  try {
    const meal = await Meal.findById(mealId);

    if (!meal) {
      return res.status(404).json({ msg: 'Meal not found' });
    }

    if (meal.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ msg: 'You are not authorized to edit this meal' });
    }

    // Prepare updated data
    const updatedData = { ...req.body };

    // Handle images
    if (req.files && req.files.length > 0) {
      const images = req.files.map((file) => file.path);
      updatedData.images = images;
    }

    // Parse fields that should be arrays
    if (typeof updatedData.ingredients === 'string') {
      updatedData.ingredients = updatedData.ingredients.split(',').map((item) => item.trim());
    }

    if (typeof updatedData.tags === 'string') {
      updatedData.tags = updatedData.tags.split(',').map((item) => item.trim());
    }

    // Similarly for other array fields...

    // Update the meal
    const updatedMeal = await Meal.findByIdAndUpdate(mealId, updatedData, { new: true });

    res.json(updatedMeal);
  } catch (err) {
    console.error('Error updating meal:', err);
    next(err);
  }
};


exports.getUserMeals = async (req, res, next) => {
  try {
    const meals = await Meal.find({ createdBy: req.user._id });
    res.json(meals);
  } catch (err) {
    console.error('Error fetching user meals:', err);
    next(err);
  }
};


