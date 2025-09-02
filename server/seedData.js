const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./src/models/User');
const Business = require('./src/models/Business');
const Review = require('./src/models/Review');
const Subscription = require('./src/models/Subscription');

console.log('Starting seed script...');

// Connect to database
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables');
    }
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Sample Users Data
const usersData = [
  {
    firstName: 'John',
    lastName: 'Admin',
    email: 'admin@servisbeta.com',
    password: 'admin123456',
    role: 'admin',
    isEmailVerified: true,
    status: 'active'
  },
  {
    firstName: 'Jane',
    lastName: 'Business',
    email: 'business@servisbeta.com',
    password: 'business123456',
    role: 'business',
    isEmailVerified: true,
    status: 'active',
    location: {
      address: 'Business District, New York',
      coordinates: [-74.0060, 40.7128]
    }
  },
  {
    firstName: 'Mike',
    lastName: 'Customer',
    email: 'customer@servisbeta.com',
    password: 'customer123456',
    role: 'user',
    isEmailVerified: true,
    status: 'active',
    location: {
      address: 'Manhattan, New York',
      coordinates: [-73.9857, 40.7484]
    }
  },
  {
    firstName: 'Sarah',
    lastName: 'Reviewer',
    email: 'reviewer@servisbeta.com',
    password: 'reviewer123456',
    role: 'user',
    isEmailVerified: true,
    status: 'active',
    preferences: {
      categories: ['Restaurant', 'Shopping', 'Entertainment']
    }
  },
  {
    firstName: 'Tom',
    lastName: 'Restaurant',
    email: 'restaurant@servisbeta.com',
    password: 'restaurant123456',
    role: 'business',
    isEmailVerified: true,
    status: 'active'
  }
];

// Sample Businesses Data
const businessesData = [
  {
    name: 'Amazing Italian Restaurant',
    category: 'Restaurant',
    description: 'Authentic Italian cuisine with fresh ingredients and traditional recipes. Family owned since 1985.',
    email: 'info@amazingitalian.com',
    phone: '+1-555-0101',
    website: 'https://amazingitalian.com',
    address: {
      street: '123 Little Italy Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10013',
      country: 'USA',
      latitude: 40.7189,
      longitude: -73.9969,
      coordinates: {
        type: 'Point',
        coordinates: [-73.9969, 40.7189]
      }
    },
    businessHours: {
      monday: { open: '11:00', close: '22:00', closed: false },
      tuesday: { open: '11:00', close: '22:00', closed: false },
      wednesday: { open: '11:00', close: '22:00', closed: false },
      thursday: { open: '11:00', close: '23:00', closed: false },
      friday: { open: '11:00', close: '23:00', closed: false },
      saturday: { open: '10:00', close: '23:00', closed: false },
      sunday: { open: '10:00', close: '21:00', closed: false }
    },
    priceRange: '$$$',
    status: 'active',
    isVerified: true,
    tags: ['Italian', 'Pizza', 'Pasta', 'Wine', 'Family-friendly']
  },
  {
    name: 'TechFix Computer Repair',
    category: 'Technology',
    description: 'Professional computer and mobile device repair services. Quick turnaround and competitive prices.',
    email: 'service@techfix.com',
    phone: '+1-555-0102',
    website: 'https://techfix.com',
    address: {
      street: '456 Tech Avenue',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
      latitude: 40.7505,
      longitude: -73.9934,
      coordinates: {
        type: 'Point',
        coordinates: [-73.9934, 40.7505]
      }
    },
    businessHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '10:00', close: '16:00', closed: false },
      sunday: { open: '', close: '', closed: true }
    },
    priceRange: '$$',
    status: 'active',
    isVerified: true,
    tags: ['Computer Repair', 'Mobile Repair', 'Data Recovery', 'Hardware']
  },
  {
    name: 'Bella Beauty Salon',
    category: 'Beauty & Spa',
    description: 'Full-service beauty salon offering hair styling, coloring, manicures, pedicures, and facial treatments.',
    email: 'appointments@bellabeauty.com',
    phone: '+1-555-0103',
    address: {
      street: '789 Fashion Boulevard',
      city: 'New York',
      state: 'NY',
      zipCode: '10014',
      country: 'USA',
      latitude: 40.7342,
      longitude: -74.0059,
      coordinates: {
        type: 'Point',
        coordinates: [-74.0059, 40.7342]
      }
    },
    businessHours: {
      monday: { open: '09:00', close: '19:00', closed: false },
      tuesday: { open: '09:00', close: '19:00', closed: false },
      wednesday: { open: '09:00', close: '19:00', closed: false },
      thursday: { open: '09:00', close: '20:00', closed: false },
      friday: { open: '09:00', close: '20:00', closed: false },
      saturday: { open: '08:00', close: '18:00', closed: false },
      sunday: { open: '', close: '', closed: true }
    },
    priceRange: '$$',
    status: 'active',
    isVerified: false,
    tags: ['Hair Salon', 'Manicure', 'Pedicure', 'Facial', 'Beauty']
  },
  {
    name: 'Downtown Coffee House',
    category: 'Cafe',
    description: 'Cozy coffee shop serving artisanal coffee, fresh pastries, and light meals. Perfect for work or relaxation.',
    email: 'hello@downtowncoffee.com',
    phone: '+1-555-0104',
    address: {
      street: '321 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10007',
      country: 'USA',
      latitude: 40.7074,
      longitude: -74.0113,
      coordinates: {
        type: 'Point',
        coordinates: [-74.0113, 40.7074]
      }
    },
    businessHours: {
      monday: { open: '06:00', close: '20:00', closed: false },
      tuesday: { open: '06:00', close: '20:00', closed: false },
      wednesday: { open: '06:00', close: '20:00', closed: false },
      thursday: { open: '06:00', close: '20:00', closed: false },
      friday: { open: '06:00', close: '21:00', closed: false },
      saturday: { open: '07:00', close: '21:00', closed: false },
      sunday: { open: '07:00', close: '19:00', closed: false }
    },
    priceRange: '$',
    status: 'active',
    isVerified: true,
    tags: ['Coffee', 'Pastries', 'WiFi', 'Study Space', 'Breakfast']
  }
];

// Sample Reviews Data (will be created after businesses)
const reviewsData = [
  {
    rating: 5,
    title: 'Outstanding Italian Experience!',
    content: 'Had an absolutely wonderful dinner here. The pasta was perfectly cooked, the sauce was rich and flavorful, and the service was impeccable. The atmosphere is cozy and romantic. Will definitely be coming back!',
    tags: ['food', 'service', 'atmosphere'],
    visitDate: new Date('2024-07-15'),
    recommendToFriend: true
  },
  {
    rating: 4,
    title: 'Great food, slightly noisy',
    content: 'The food quality is excellent and authentic. Portions are generous and prices are reasonable. Only downside is it can get quite noisy during peak hours, making conversation difficult.',
    tags: ['food', 'value', 'noise'],
    visitDate: new Date('2024-07-20'),
    recommendToFriend: true
  },
  {
    rating: 5,
    title: 'Fixed my laptop perfectly!',
    content: 'My laptop was running extremely slow and had several issues. The team at TechFix diagnosed and fixed everything within 2 hours. Great service and fair pricing. Highly recommended!',
    tags: ['service', 'speed', 'pricing'],
    visitDate: new Date('2024-07-18'),
    recommendToFriend: true
  },
  {
    rating: 3,
    title: 'Average coffee experience',
    content: 'Coffee is decent but nothing special. The atmosphere is nice for studying but the WiFi can be spotty at times. Staff is friendly though.',
    tags: ['coffee', 'wifi', 'staff'],
    visitDate: new Date('2024-07-22'),
    recommendToFriend: false
  }
];

// Sample Subscriptions Data
const subscriptionsData = [
  {
    plan: 'premium',
    startDate: new Date('2024-07-01'),
    endDate: new Date('2024-12-31'),
    paymentStatus: 'completed',
    paymentHistory: [{
      amount: 99.99,
      date: new Date('2024-07-01'),
      gateway: 'stripe',
      transactionId: 'txn_premium_001'
    }]
  },
  {
    plan: 'paid',
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-12-01'),
    paymentStatus: 'completed',
    paymentHistory: [{
      amount: 29.99,
      date: new Date('2024-06-01'),
      gateway: 'stripe',
      transactionId: 'txn_paid_001'
    }]
  }
];

// Seed function
const seedData = async () => {
  try {
    // Connect to database
    await connectDB();

    // Import models after database connection
    console.log('Importing models...');
    const User = require('./src/models/User');
    console.log('User model imported');
    
    const Business = require('./src/models/Business');  
    console.log('Business model imported');
    
    const Review = require('./src/models/Review');
    console.log('Review model imported');
    
    const Subscription = require('./src/models/Subscription');
    console.log('Subscription model imported');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Business.deleteMany({});
    await Review.deleteMany({});
    await Subscription.deleteMany({});
    
    // Clear any indexes that might cause conflicts
    try {
      await Business.collection.dropIndexes();
      console.log('Business indexes cleared');
    } catch (e) {
      console.log('No business indexes to clear');
    }
    
    console.log('Existing data cleared');

    // Create Users (one by one to trigger password hashing middleware)
    console.log('Creating users...');
    const createdUsers = [];
    
    for (let i = 0; i < usersData.length; i++) {
      try {
        const user = await User.create(usersData[i]);
        createdUsers.push(user);
        console.log(`Created user: ${user.email}`);
      } catch (error) {
        console.error(`Failed to create user ${usersData[i].email}:`, error.message);
      }
    }
    
    console.log(`${createdUsers.length} users created`);

    // Assign owners to businesses
    const businessOwners = createdUsers.filter(user => user.role === 'business');
    const regularUsers = createdUsers.filter(user => user.role === 'user');

    // Create Businesses with owners
    console.log('Creating businesses...');
    const createdBusinesses = [];
    
    for (let i = 0; i < businessesData.length; i++) {
      const businessData = {
        ...businessesData[i],
        owner: businessOwners[i % businessOwners.length]._id
      };
      
      try {
        const business = await Business.create(businessData);
        createdBusinesses.push(business);
        console.log(`Created business: ${business.name}`);
      } catch (error) {
        console.error(`Failed to create business ${businessesData[i].name}:`, error.message);
      }
    }
    
    console.log(`${createdBusinesses.length} businesses created`);

    // Create Reviews
    console.log('Creating reviews...');
    const reviewsToCreate = reviewsData.map((review, index) => ({
      ...review,
      user: regularUsers[index % regularUsers.length]._id,
      business: createdBusinesses[index % createdBusinesses.length]._id
    }));
    
    const createdReviews = await Review.insertMany(reviewsToCreate);
    console.log(`${createdReviews.length} reviews created`);

    // Create Subscriptions
    console.log('Creating subscriptions...');
    const subscriptionsToCreate = subscriptionsData.map((subscription, index) => ({
      ...subscription,
      business: createdBusinesses[index % createdBusinesses.length]._id
    }));
    
    const createdSubscriptions = await Subscription.insertMany(subscriptionsToCreate);
    console.log(`${createdSubscriptions.length} subscriptions created`);

    // Update business ratings (simulate rating calculations)
    console.log('Updating business ratings...');
    for (const business of createdBusinesses) {
      const businessReviews = createdReviews.filter(
        review => review.business.toString() === business._id.toString()
      );
      
      if (businessReviews.length > 0) {
        const totalRating = businessReviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / businessReviews.length;
        
        await Business.findByIdAndUpdate(business._id, {
          averageRating: averageRating,
          totalReviews: businessReviews.length
        });
      }
    }

    console.log('\n=== SEED DATA SUMMARY ===');
    console.log(`✅ Users: ${createdUsers.length}`);
    console.log(`✅ Businesses: ${createdBusinesses.length}`);
    console.log(`✅ Reviews: ${createdReviews.length}`);
    console.log(`✅ Subscriptions: ${createdSubscriptions.length}`);

    console.log('\n=== TEST ACCOUNTS ===');
    console.log('🔑 Admin Account:');
    console.log('   Email: admin@servisbeta.com');
    console.log('   Password: admin123456');
    console.log('');
    console.log('👤 Business Owner Account:');
    console.log('   Email: business@servisbeta.com');
    console.log('   Password: business123456');
    console.log('');
    console.log('👤 Customer Account:');
    console.log('   Email: customer@servisbeta.com');
    console.log('   Password: customer123456');
    console.log('');
    console.log('👤 Reviewer Account:');
    console.log('   Email: reviewer@servisbeta.com');
    console.log('   Password: reviewer123456');

    console.log('\n✅ Database seeded successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seed function
if (require.main === module) {
  seedData();
}

module.exports = { seedData };
