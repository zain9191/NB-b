// File: /controllers/mealController.js
const Meal = require('../models/Meal');

// Create a new meal
exports.createMeal = async (req, res) => {
  const { name, description, price } = req.body;

  try {
    const meal = new Meal({
      name,
      description,
      price,
      chef: req.user.id,
    });

    await meal.save();
    res.status(201).json(meal);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get all meals
exports.getMeals = async (req, res) => {
  try {
    const meals = await Meal.find().populate('chef', 'name');
    res.json(meals);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
