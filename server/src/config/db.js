const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not defined');
    }
    
    await mongoose.connect(process.env.MONGO_URI, {
      // Removed deprecated options for MongoDB Driver 4.0+
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      maxPoolSize: 10, // Maintain up to 10 socket connections
      bufferCommands: false, // Disable mongoose buffering
      bufferMaxEntries: 0 // Disable mongoose buffering
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    
    // For serverless functions, don't exit the process
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      console.error('Database connection failed in production environment');
      throw err; // Re-throw to handle at application level
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
