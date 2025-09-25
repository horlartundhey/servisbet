const mongoose = require('mongoose');
require('dotenv').config();

async function checkUser() {
  try {
    console.log('Connecting to database...');
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    console.log('Using MongoDB URI:', mongoUri ? 'Found' : 'Not found');
    await mongoose.connect(mongoUri);
    
    const User = require('./src/models/User');
    const BusinessProfile = require('./src/models/BusinessProfile');
    
    console.log('Checking user 68b5a2eb89bca9ab53c90504...');
    
    const user = await User.findById('68b5a2eb89bca9ab53c90504');
    console.log('User found:', user ? {
      name: user.firstName + ' ' + user.lastName,
      email: user.email,
      role: user.role,
      id: user._id.toString()
    } : 'User not found');
    
    const businesses = await BusinessProfile.find({ owner: '68b5a2eb89bca9ab53c90504' });
    console.log('Businesses found:', businesses.length);
    businesses.forEach(business => {
      console.log('- Business:', {
        name: business.businessName,
        id: business._id.toString(),
        owner: business.owner.toString(),
        active: business.isActive,
        primary: business.isPrimary,
        slug: business.businessSlug
      });
    });
    
    // Also check if user has any old Business model entries
    try {
      const Business = require('./src/models/Business');
      const oldBusinesses = await Business.find({ owner: '68b5a2eb89bca9ab53c90504' });
      console.log('Old Business model entries:', oldBusinesses.length);
      oldBusinesses.forEach(business => {
        console.log('- Old Business:', {
          name: business.name,
          id: business._id.toString(),
          owner: business.owner.toString()
        });
      });
    } catch (e) {
      console.log('No old Business model found');
    }
    
    mongoose.disconnect();
    console.log('Database check complete');
  } catch (error) {
    console.error('Error:', error.message);
    mongoose.disconnect();
  }
}

checkUser();