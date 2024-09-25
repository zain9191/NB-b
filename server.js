// server.js

const express = require('express');
const app = express();
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');

// Connect to MongoDB
connectDB();

// Initialize Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors());

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const mealRoutes = require('./routes/meal');
const authRoutes = require('./routes/auth');
const addressRoutes = require('./routes/address');
const profileRoutes = require('./routes/profile');

// Mount Routes
app.use('/api/meals', mealRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/address', addressRoutes);
app.use('/api/profile', profileRoutes);

// Error Handling Middleware
app.use(require('./middleware/errorHandler'));

// Set the port
const PORT = process.env.PORT || 5080;

// Start the server
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
