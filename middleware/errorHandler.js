// middleware/errorHandler.js
module.exports = (err, req, res, next) => {
  console.error('Error occurred:');
  console.error('Request Path:', req.path);
  console.error('Request Method:', req.method);
  console.error('Request Body:', req.body);
  console.error('Request Headers:', req.headers);
  console.error('Error Stack Trace:', err.stack);

  res.status(500).json({
    success: false,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : null,
  });

  console.log('Error response sent to client');
};
