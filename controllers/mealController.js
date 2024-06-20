// controllers/mealController.js
const Meal = require('../models/Meal');

exports.createMeal = async (req, res, next) => {
  const { name, description, price, ingredients } = req.body;
  const images = req.files.map(file => file.path); // Assume file paths are stored

  try {
    if (req.user.role !== 'chef') {
      return res.status(403).json({ msg: 'Access denied, only chefs can create meals' });
    }

    const meal = new Meal({
      name,
      description,
      price,
      ingredients: ingredients.split(','), // Assuming ingredients are sent as a comma-separated string
      images,
      chef: req.user.id,
    });

    await meal.save();
    res.status(201).json(meal);
  } catch (err) {
    next(err);
  }
};

exports.getMeals = async (req, res, next) => {
  try {
    const meals = await Meal.find().populate('chef', 'name');
    res.json(meals);
  } catch (err) {
    next(err);
  }
};
