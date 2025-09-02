// Express app setup
const express = require('express');
const app = express();

app.use(express.json());

// Example route
app.get('/', (req, res) => {
  res.send('API Server Running');
});

module.exports = app;
