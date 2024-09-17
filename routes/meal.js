const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const mongoose = require('mongoose'); // Import mongoose for ObjectId usage
const { createMeal, getMeals } = require('../controllers/mealController');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Create a meal with images, ensuring user_id (now _id) is included
router.post('/create', auth, upload.array('images', 5), (req, res, next) => {
  // Attach MongoDB ObjectId to the request body before calling the controller
  req.body.user_id = mongoose.Types.ObjectId(req.user._id); // Use MongoDB ObjectId
  createMeal(req, res, next);
});

// Get meals, ensuring user_id (now _id) is used when needed
router.get('/', auth, (req, res, next) => {
  // Attach MongoDB ObjectId to the request query to filter meals by the logged-in user
  req.query.user_id = mongoose.Types.ObjectId(req.user._id); // Use MongoDB ObjectId
  getMeals(req, res, next);
});

module.exports = router;
