// File: routes/meal.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac'); // Import RBAC middleware if roles are implemented
const {
  createMeal,
  getMeals,
  getMealById,
  updateMeal,
  getUserMeals,
  getFilterOptions,
  deleteMeal, // Ensure deleteMeal is implemented
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
// Assuming only chefs can create meals; adjust as per your RBAC setup
router.post('/create', auth, rbac('chef'), upload.array('images', 5), createMeal);

// Update a meal
router.put('/update/:id', auth, rbac('chef'), upload.array('images', 5), updateMeal);

// Delete a meal
router.delete('/delete/:id', auth, rbac('chef'), deleteMeal); // Implement deleteMeal controller

module.exports = router;
