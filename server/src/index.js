// Testing middleware - all routes work, issue is in middleware
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Basic CORS
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://servisbet-client.vercel.app',
    'https://servisbet-client-git-main-horlartundheys-projects.vercel.app',
    'https://lynki.gemorah.org',  // cPanel shared hosting domain
    'http://lynki.gemorah.org'     // Allow both http and https
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

app.use(cors(corsOptions));

// REMOVED: app.options('*', cors(corsOptions)); - This was causing the error!

app.use(express.json({ 
  limit: process.env.MAX_FILE_SIZE ? `${process.env.MAX_FILE_SIZE / (1024 * 1024)}mb` : '10mb' 
}));
app.use(express.urlencoded({ extended: true }));

// Testing: Add database connection middleware
app.use(async (req, res, next) => {
  try {
    await connectDB(); // This might be causing the issue
    next();
  } catch (error) {
    console.error('Database middleware error:', error);
    res.status(500).json({ success: false, message: 'Database connection error' });
  }
});

// Add routes one by one to find the problematic one
// ✅ Auth routes work
app.use('/api/auth', require('./routes/auth'));
// ✅ Business routes work
app.use('/api/business', require('./routes/business'));
// ✅ Business verification, profile, review work
app.use('/api/business', require('./routes/businessVerification'));
app.use('/api/business-profile', require('./routes/businessProfile'));
app.use('/api/review', require('./routes/review'));
// Testing remaining routes
app.use('/api/disputes', require('./routes/dispute'));
app.use('/api/templates', require('./routes/template'));
app.use('/api/subscription', require('./routes/subscription'));
app.use('/api/flag', require('./routes/flag'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/upload', require('./routes/businessImageUpload'));
app.use('/api/analytics', require('./routes/analytics'));

// Basic health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ServisbetA API Server Running - FIXED!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'API Test Endpoint - Testing Error Handler'
  });
});

// Health check endpoint for monitoring and diagnostics
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    message: 'ServisbetA API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Alias for businesses endpoint (client uses /api/businesses but server has /api/business)
app.use('/api/businesses', require('./routes/business'));

// Testing: Add error handler middleware (must be last)
app.use(errorHandler);

module.exports = app;
