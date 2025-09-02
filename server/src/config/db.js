const mongoose = require('mongoose');

// Cache the database connection in serverless environments
let cachedConnection = null;

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not defined');
    }

    // Return cached connection if it exists and is ready
    if (cachedConnection && mongoose.connection.readyState === 1) {
      console.log('Using cached MongoDB connection');
      return cachedConnection;
    }

    // If there's a connection but it's not ready, wait for it
    if (mongoose.connection.readyState === 2) {
      console.log('Waiting for existing MongoDB connection...');
      await new Promise((resolve, reject) => {
        mongoose.connection.once('connected', resolve);
        mongoose.connection.once('error', reject);
        // Timeout after 10 seconds
        setTimeout(() => reject(new Error('Connection timeout')), 10000);
      });
      return mongoose.connection;
    }
    
    // Optimized connection options for Vercel serverless functions
    const connectionOptions = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      maxPoolSize: 1, // Limit to 1 connection for serverless
      maxIdleTimeMS: 10000, // Close connections after 10 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
      connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };
    
    console.log('Connecting to MongoDB...');
    cachedConnection = await mongoose.connect(process.env.MONGO_URI, connectionOptions);
    console.log('MongoDB connected successfully');
    
    return cachedConnection;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    cachedConnection = null; // Reset cache on error
    
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
