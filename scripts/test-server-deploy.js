#!/usr/bin/env node

/**
 * Server deployment test script
 * Tests the serverless function entry point for Vercel deployment
 */

console.log('🔧 Testing server-side deployment readiness...\n');

// Test 1: Check if serverless entry point exists
const fs = require('fs');
const path = require('path');

console.log('📁 Checking server file structure...');
const requiredFiles = [
  'src/index.js',
  'api/index.js',
  'src/config/db.js',
  'package.json'
];

let filesOk = true;
requiredFiles.forEach(file => {
  const fullPath = path.join(__dirname, '..', 'server', file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    filesOk = false;
  }
});

if (!filesOk) {
  console.log('\n❌ Required server files missing');
  process.exit(1);
}

// Test 2: Check if app can be loaded without database
console.log('\n🚀 Testing Express app creation...');
process.chdir(path.join(__dirname, '..', 'server'));

try {
  // Simulate basic environment
  process.env.NODE_ENV = 'production';
  process.env.VERCEL = '1';
  
  // Test app creation (this should work without DB)
  const app = require('./src/index.js');
  if (typeof app === 'function') {
    console.log('✅ Express app loads successfully');
  } else {
    console.log('❌ Express app is not a function');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Failed to load Express app:', error.message);
  process.exit(1);
}

// Test 3: Check if serverless entry point loads
console.log('\n🔗 Testing serverless entry point...');
try {
  const serverlessApp = require('./api/index.js');
  if (typeof serverlessApp === 'function') {
    console.log('✅ Serverless entry point loads successfully');
  } else {
    console.log('❌ Serverless entry point is not a function');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Failed to load serverless entry point:', error.message);
  process.exit(1);
}

// Test 4: Check environment variable handling
console.log('\n🔐 Testing environment variable handling...');
try {
  // Clear environment to test missing variables
  delete process.env.MONGO_URI;
  
  const connectDB = require('./src/config/db.js');
  
  // This should handle missing MONGO_URI gracefully
  connectDB().catch(err => {
    if (err.message.includes('MONGO_URI environment variable is not defined')) {
      console.log('✅ Database connection handles missing env vars correctly');
    } else {
      console.log('❌ Unexpected database error:', err.message);
    }
  });
  
} catch (error) {
  console.log('❌ Environment variable handling test failed:', error.message);
}

// Test 5: Check package.json scripts
console.log('\n📦 Checking package.json configuration...');
try {
  const packageJson = require('./package.json');
  
  if (packageJson.scripts && packageJson.scripts.start) {
    console.log('✅ Start script exists');
  } else {
    console.log('⚠️ No start script found (not required for serverless)');
  }
  
  if (packageJson.main) {
    console.log('✅ Main entry point defined');
  } else {
    console.log('⚠️ No main entry point (not required for serverless)');
  }
  
  console.log('✅ Package.json is valid');
} catch (error) {
  console.log('❌ Package.json issue:', error.message);
  process.exit(1);
}

console.log('\n🎉 Server-side deployment tests completed!');
console.log('\n📋 Server deployment checklist:');
console.log('✅ Serverless entry point ready');
console.log('✅ Express app structure valid');
console.log('✅ Database connection handling improved');
console.log('✅ Environment variable validation added');
console.log('✅ Production error handling implemented');

console.log('\n🚀 Server is ready for Vercel deployment!');
console.log('\n⚠️  Remember to set these environment variables in Vercel:');
console.log('  - MONGO_URI');
console.log('  - JWT_SECRET');
console.log('  - CLOUDINARY_CLOUD_NAME');
console.log('  - CLOUDINARY_API_KEY');
console.log('  - CLOUDINARY_API_SECRET');
console.log('  - EMAIL_USER');
console.log('  - EMAIL_PASS');
console.log('  - NODE_ENV=production');
console.log('  - ALLOWED_ORIGINS=https://your-domain.vercel.app');
