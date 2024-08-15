const Meal = require('../models/Meal');

// controllers/mealController.js
const Meal = require('../models/Meal');

exports.createMeal = async (req, res, next) => {
  const { name, description, price, ingredients } = req.body;
  const images = req.files.map(file => file.path);

  try {
    const meal = new Meal({
      name,
      description,
      price,
      ingredients: ingredients.split(','),
      images,
      createdBy: req.user.id,  // Store the ID of the user creating the meal
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
    const meals = await Meal.find().populate('createdBy', 'name email');  
    res.json(meals);
  } catch (err) {
    next(err);
  }
};
