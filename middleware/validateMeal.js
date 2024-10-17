 
const mealSchema = require('../validation/mealSchema');

const validateMeal = (req, res, next) => {
  try {
     if (typeof req.body.nutritionalInfo === 'string') {
      req.body.nutritionalInfo = JSON.parse(req.body.nutritionalInfo);
    }
    if (typeof req.body.contactInformation === 'string') {
      req.body.contactInformation = JSON.parse(req.body.contactInformation);
    }

     const { error } = mealSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ success: false, error: error.details[0].message });
    }

    next();
  } catch (error) {
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON format in nutritionalInfo or contactInformation.',
      });
    }
    next(error);
  }
};

module.exports = validateMeal;
