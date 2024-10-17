 
const parseJsonFields = (fields) => (req, res, next) => {
    try {
      fields.forEach((field) => {
        if (typeof req.body[field] === 'string') {
          req.body[field] = JSON.parse(req.body[field]);
        }
      });
      next();
    } catch (error) {
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON format in one of the JSON fields.',
        });
      }
      next(error);
    }
  };
  
  module.exports = parseJsonFields;
  