const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const {
  createMeal,
  getMeals,
  getMealById,
  updateMeal,
  getUserMeals,
  getFilterOptions,
  deleteMeal,
} = require('../controllers/mealController');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Static Routes
router.get('/user', auth, getUserMeals);
router.get('/filters', getFilterOptions);

// **RESTful Route for Creating a Meal**
router.post('/', auth, rbac('chef'), upload.array('images', 5), createMeal);

// **Dynamic Routes**
router.get('/:id', getMealById);
router.put('/:id', auth, rbac('chef'), upload.array('images', 5), updateMeal);
router.delete('/:id', auth, rbac('chef'), deleteMeal);

// Get all meals
router.get('/', getMeals);

module.exports = router;
