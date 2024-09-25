// routes/meal.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const {
  createMeal,
  getMeals,
  getMealById,
  updateMeal,
  getUserMeals,
  getFilterOptions,
} = require('../controllers/mealController');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Get meals created by the authenticated user
router.get('/user', auth, getUserMeals);

// Route for filter options
router.get('/filters', getFilterOptions);

// Get all meals
router.get('/', getMeals);

// Get a specific meal by id
router.get('/:id', getMealById);

// Create a meal with images
router.post('/create', auth, upload.array('images', 5), createMeal);

// Update a meal
router.put('/update/:id', auth, upload.array('images', 5), updateMeal);

module.exports = router;
