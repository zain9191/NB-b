// app.js

const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');

// Import dotenv and load environment variables
const dotenv = require('dotenv');
dotenv.config();

// Import the database connection function
const connectDB = require('./config/db');

// Connect to the database
connectDB();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Static files (for serving images and uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const authRoutes = require('./routes/auth');
const mealRoutes = require('./routes/meal');
const addressRoutes = require('./routes/address');
const profileRoutes = require('./routes/profile');
// Add other route imports as necessary

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/address', addressRoutes);
app.use('/api/profile', profileRoutes);
// Add other route mounts as necessary

// Error handling middleware (if you have any)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start the server
const PORT = process.env.PORT || 5080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
