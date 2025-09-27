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

// Basic health check only
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Test Server Running - Path-to-RegExp Debug'
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'API Test Endpoint'
  });
});

module.exports = app;
