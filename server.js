const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const cors = require('cors'); // Import the cors package



dotenv.config(); // Load environment variables from .env file

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(express.json()); // Parse JSON bodies

//  origin based on frontend's URL)
app.use(cors({
  origin: 'http://localhost:3000'
}));

// Import routes
const authRoute = require('./routes/auth');
const userRoute = require('./routes/user');
const chefRoute = require('./routes/chef');
const profileRoute = require('./routes/profile');
const addressRoute = require('./routes/address');

// Define routes
app.use('/api/auth', authRoute);
app.use('/api/users', userRoute); // Keep the old route for users
app.use('/api/chefs', chefRoute); // Keep the old route for chefs
app.use('/api/profile', profileRoute); // Keep the old route for profiles
app.use('/api/address', addressRoute); // New route for addresses

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 5080; // Use the same port as before, or update if needed
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
