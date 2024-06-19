const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config(); // Load environment variables from .env file

const app = express();

// Connect to database
connectDB();

// CORS configuration (allowing requests from http://localhost:3000)
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Allow credentials
}));

// Middleware
app.use(express.json()); // Parse JSON bodies

// Serve static files from the /uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from the 'assets' directory
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Import routes
const authRoute = require('./routes/auth');
const userRoute = require('./routes/user');
const chefRoute = require('./routes/chef');
const profileRoute = require('./routes/profile');
const addressRoute = require('./routes/address');
const mealRoute = require('./routes/meal');

// Define routes
app.use('/api/auth', authRoute);
app.use('/api/users', userRoute); // Keep the old route for users
app.use('/api/chefs', chefRoute); // Keep the old route for chefs
app.use('/api/profile', profileRoute); // New route for profile, including upload functionality
app.use('/api/address', addressRoute); // New route for addresses
app.use('/api/meals', mealRoute); // New route for meals

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 5080; // Use the same port as before, or update if needed
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
