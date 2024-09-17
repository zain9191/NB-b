
const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const { createMeal, getMeals, getMealById } = require('../controllers/mealController');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Create a meal with images
router.post('/create', auth, upload.array('images', 5), createMeal);

// Get all meals
router.get('/', auth, getMeals);

// Get a specific meal by id
router.get('/:id', auth, getMealById);

module.exports = router;
