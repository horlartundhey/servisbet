// Testing middleware - all routes work, issue is in middleware
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Basic CORS
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://servisbet-client.vercel.app',
    'https://servisbet-client-git-main-horlartundheys-projects.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

app.use(cors(corsOptions));
app.use(express.json());

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
    message: 'Server Running - Testing Database Middleware',
    timestamp: new Date().toISOString()
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'API Test Endpoint - Auth Routes Added'
  });
});

module.exports = app;
