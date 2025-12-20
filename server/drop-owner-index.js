const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const dropOwnerIndex = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    console.log('MongoDB URI:', mongoUri ? '✓ Found' : '✗ Not found');
    
    if (!mongoUri) {
      throw new Error('MONGO_URI not found in .env');
    }
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    
    const db = mongoose.connection.db;
    const collection = db.collection('businessprofiles');
    
    console.log('Fetching current indexes...');
    const indexes = await collection.listIndexes().toArray();
    console.log('Current indexes:', indexes.map(idx => idx.name));
    
    // Drop the owner_1 index if it exists
    const ownerIndex = indexes.find(idx => idx.name === 'owner_1');
    if (ownerIndex) {
      console.log('Dropping owner_1 index...');
      await collection.dropIndex('owner_1');
      console.log('✅ Successfully dropped owner_1 index');
    } else {
      console.log('ℹ️  owner_1 index not found');
    }
    
    // Verify the index is gone
    const updatedIndexes = await collection.listIndexes().toArray();
    console.log('Updated indexes:', updatedIndexes.map(idx => idx.name));
    
    await mongoose.disconnect();
    console.log('✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

dropOwnerIndex();
