const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected successfully');
    
    console.log('Testing models...');
    
    const User = require('./src/models/User');
    console.log('✅ User model loaded');
    
    const Business = require('./src/models/Business');  
    console.log('✅ Business model loaded');
    
    const Review = require('./src/models/Review');
    console.log('✅ Review model loaded');
    
    const Subscription = require('./src/models/Subscription');
    console.log('✅ Subscription model loaded');
    
    // Test creating a simple user
    const testUser = new User({
      name: 'Test User',
      email: 'test@test.com',
      password: 'password123'
    });
    
    console.log('✅ User instance created successfully');
    
    await mongoose.disconnect();
    console.log('✅ Test completed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testConnection();
