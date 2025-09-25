// Server entry point
require('dotenv').config();
const app = require('./index');
const connectDB = require('./config/db');
const cronJobService = require('./services/cronJobService');
const socketService = require('./services/socketService');
const http = require('http');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
socketService.initialize(server);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`🔌 Socket.io enabled for real-time notifications`);
    
    // Start cron jobs only if not in serverless environment
    if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
      cronJobService.startJobs();
    } else {
      console.log('⚠️  Skipping cron jobs in serverless environment');
    }
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Gracefully shutting down...');
  cronJobService.stopJobs();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Gracefully shutting down...');
  cronJobService.stopJobs();
  process.exit(0);
});
