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
    });

    await meal.save();
    res.status(201).json(meal);
  } catch (err) {
    next(err);
  }
};

exports.getMeals = async (req, res, next) => {
  try {
    const meals = await Meal.find();
    res.json(meals);
  } catch (err) {
    next(err);
  }
};
