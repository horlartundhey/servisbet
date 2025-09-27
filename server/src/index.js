// Minimal test version to isolate the path-to-regexp error
const express = require('express');
const cors = require('cors');

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

// Add routes one by one to find the problematic one
// Starting with auth routes
app.use('/api/auth', require('./routes/auth'));

// Basic health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Server Running - Testing Auth Routes',
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
