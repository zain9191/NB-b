
const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const { createMeal, getMeals, getMealById, updateMeal, getUserMeals } = require('../controllers/mealController');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Create a meal with images
router.post('/create', auth, upload.array('images', 5), createMeal);

// Get all meals
router.get('/', getMeals);

// Get meals created by the authenticated user
router.get('/user', auth, getUserMeals);

// Get a specific meal by id
router.get('/:id', getMealById);

// Update a meal
router.put('/update/:id', auth, upload.array('images', 5), updateMeal);





module.exports = router;
