const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const checkChef = require('../middleware/checkChef');
const { createMeal, getMeals } = require('../controllers/mealController');

const upload = multer({ dest: 'uploads/' });

router.post('/create', auth, checkChef, upload.array('images', 5), createMeal);
router.get('/', getMeals);

module.exports = router;
