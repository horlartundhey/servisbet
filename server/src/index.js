// Express app setup
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middlewares/errorHandler');
const connectDB = require('./config/db');

const app = express();

// CORS Configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',') : 
    ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ 
  limit: process.env.MAX_FILE_SIZE ? `${process.env.MAX_FILE_SIZE / (1024 * 1024)}mb` : '10mb' 
}));
app.use(express.urlencoded({ extended: true }));

// Database connection middleware for serverless
app.use(async (req, res, next) => {
  try {
    await connectDB(); // This will handle caching and connection reuse
    next();
  } catch (error) {
    console.error('Database middleware error:', error);
    res.status(500).json({ success: false, message: 'Database connection error' });
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/business', require('./routes/business'));
app.use('/api/business-profile', require('./routes/businessProfile'));
app.use('/api/review', require('./routes/review'));
app.use('/api/subscription', require('./routes/subscription'));
app.use('/api/flag', require('./routes/flag'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/upload', require('./routes/upload'));

// Health check route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ServisbetA API Server Running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'ServisbetA API Endpoint',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Error handler middleware (must be last)
app.use(errorHandler);

module.exports = app;
