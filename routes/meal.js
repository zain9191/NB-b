// File: /routes/meal.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkChef = require('../middleware/checkChef');
const { createMeal, getMeals } = require('../controllers/mealController');

// Route to create a new meal (only for chefs)
router.post('/create', auth, checkChef, createMeal);

// Route to get all meals (available for everyone)
router.get('/', getMeals);

module.exports = router;
