 
const mealSchema = require('../validation/mealSchema');

const validateMeal = (req, res, next) => {
  const { error } = mealSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }
  next();
};

module.exports = validateMeal;
