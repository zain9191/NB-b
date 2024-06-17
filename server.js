const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const cors = require('cors'); // Import the cors package

require('dotenv').config();

const app = express();

// Connect Database
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));

// Enable CORS
app.use(cors({
  origin: 'http://localhost:3000' // Specify the frontend URL
}));

// Define Routes
app.use('/api/users', require('./routes/user')); //  this should matches the file name
app.use('/api/chefs', require('./routes/chef')); //  this should matches the file name

app.use('/api/profile', require('./routes/profile'));


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 5080;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
