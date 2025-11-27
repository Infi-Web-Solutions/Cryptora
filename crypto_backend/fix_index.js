const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/crypto_platform')
  .then(async () => {
    console.log('✅ MongoDB connected');
    await fixIndexes();
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function fixIndexes() {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('walletusers');

    console.log('🔧 Fixing indexes for walletusers collection...');

    // Drop old index if it exists
    try {
      await collection.dropIndex('wallet_address_1');
      console.log('✅ Dropped old wallet_address_1 index');
    } catch (error) {
      console.log('ℹ️ Old wallet_address_1 index not found or already dropped');
    }

    // Create new index on walletAddress field
    await collection.createIndex({ walletAddress: 1 }, { unique: true });
    console.log('✅ Created new unique index on walletAddress field');

    // List all indexes
    const indexes = await collection.indexes();
    console.log('📋 Current indexes:', indexes.map(idx => idx.name));

    console.log('✅ Index fix completed');
  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
  } finally {
    mongoose.connection.close();
  }
}
