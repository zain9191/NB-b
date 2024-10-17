 
const express = require('express');
const router = express.Router();
const mealController = require('../controllers/mealController');
const validateMeal = require('../middleware/validateMeal');
const multer = require('multer');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const parseJsonFields = require('../middleware/parseJsonFields');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Create a new meal
router.post(
  '/',
  auth,
  rbac('chef'),
  upload.array('images', 5),
  parseJsonFields(['nutritionalInfo', 'contactInformation']),
  validateMeal,
  mealController.createMeal
);

// Update an existing meal
router.put(
  '/:id',
  auth,
  rbac('chef'),
  upload.array('images', 5),
  parseJsonFields(['nutritionalInfo', 'contactInformation']),
  validateMeal,
  mealController.updateMeal
);


// Get filter options for meals
router.get('/filters', mealController.getFilterOptions);


// Get all meals
router.get('/', mealController.getMeals);



// Delete a meal
router.delete('/:id', auth, rbac('chef'), mealController.deleteMeal);

// Get meals for a specific user
router.get('/user', auth, mealController.getUserMeals);

// Get a specific meal by ID
router.get('/:id', mealController.getMealById);



module.exports = router;


