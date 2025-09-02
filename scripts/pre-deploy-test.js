#!/usr/bin/env node

/**
 * Pre-deployment build test script
 * Validates that both client and server are ready for production deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting pre-deployment build test...\n');

// Test client build
console.log('📦 Testing client build...');
try {
  process.chdir('client');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Check if dist folder was created
  if (fs.existsSync('dist')) {
    console.log('✅ Client build successful!\n');
  } else {
    console.log('❌ Client build failed - no dist folder found\n');
    process.exit(1);
  }
  
  process.chdir('..');
} catch (error) {
  console.log('❌ Client build failed:', error.message);
  process.exit(1);
}

// Check server files
console.log('🔧 Checking server configuration...');
const serverFiles = [
  'server/src/index.js',
  'server/api/index.js',
  'server/package.json'
];

let serverValid = true;
serverFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    serverValid = false;
  }
});

if (!serverValid) {
  console.log('\n❌ Server configuration incomplete');
  process.exit(1);
}

// Check vercel configuration
console.log('\n⚙️ Checking Vercel configuration...');
const vercelFiles = [
  'vercel.json',
  '.vercelignore',
  '.env.example'
];

let vercelValid = true;
vercelFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    vercelValid = false;
  }
});

if (!vercelValid) {
  console.log('\n❌ Vercel configuration incomplete');
  process.exit(1);
}

console.log('\n🎉 Pre-deployment check completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Set up environment variables in Vercel dashboard');
console.log('2. Deploy using: vercel --prod');
console.log('3. Update VITE_API_BASE_URL with your Vercel domain');
console.log('\n🚀 Ready for deployment!');
