// middleware/errorHandler.js
module.exports = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
      success: false,
      error: err.message,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
  };
  