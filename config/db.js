 const mongoose = require('mongoose');
const dotenv = require('dotenv');

 dotenv.config();

 const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];

 const validateEnvVars = () => {
  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};

 validateEnvVars();

 const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {

    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    throw error;
  }
};

module.exports = connectDB;
