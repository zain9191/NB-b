 
const express = require('express');
const router = express.Router();
const mealController = require('../controllers/mealController');
const validateMeal = require('../middleware/validateMeal');
const multer = require('multer');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Create a new meal
router.post('/meals', auth, rbac('chef'), upload.array('images', 5), validateMeal, mealController.createMeal);

// Update an existing meal
router.put('/meals/:id', auth, rbac('chef'), upload.array('images', 5), validateMeal, mealController.updateMeal);

// Get all meals
router.get('/meals', mealController.getMeals);

// Get a specific meal by ID
router.get('/meals/:id', mealController.getMealById);

// Delete a meal
router.delete('/meals/:id', auth, rbac('chef'), mealController.deleteMeal);

// Get meals for a specific user
router.get('/meals/user', auth, mealController.getUserMeals);

// Get filter options for meals
router.get('/meals/filters', mealController.getFilterOptions);

module.exports = router;
