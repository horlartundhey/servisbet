// Script to generate slugs for existing businesses
require('dotenv').config();
const mongoose = require('mongoose');
const BusinessProfile = require('./src/models/BusinessProfile');

async function generateSlugsForExistingBusinesses() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/servisbeta');
    console.log('✅ Connected to MongoDB');

    // Find businesses without slugs
    const businessesWithoutSlugs = await BusinessProfile.find({
      $or: [
        { businessSlug: { $exists: false } },
        { businessSlug: null },
        { businessSlug: '' }
      ]
    });

    console.log(`Found ${businessesWithoutSlugs.length} businesses without slugs`);

    // Generate slugs for each business
    for (let business of businessesWithoutSlugs) {
      const oldSlug = business.businessSlug;
      
      // Trigger the pre-save hook to generate slug
      await business.save();
      
      console.log(`✅ Generated slug for "${business.businessName}": ${business.businessSlug}`);
    }

    console.log('✅ All businesses now have slugs');
    
    // Display all businesses with their slugs
    const allBusinesses = await BusinessProfile.find({}, 'businessName businessSlug').limit(10);
    console.log('\n📋 Sample businesses with slugs:');
    allBusinesses.forEach(business => {
      console.log(`  • ${business.businessName} → /business/${business.businessSlug}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

generateSlugsForExistingBusinesses();