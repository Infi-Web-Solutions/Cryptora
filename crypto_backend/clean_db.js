const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/crypto_platform')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Define the User model (same as in User.js)
const userSchema = new mongoose.Schema({
  wallet_address: { type: String, required: true, unique: true, lowercase: true },
  is_active: { type: Boolean, default: true },
  is_staff: { type: Boolean, default: false },
  date_joined: { type: Date, default: Date.now },
  password: { type: String } // Optional for wallet-only login
});

const User = mongoose.model('User', userSchema);

// Define the WalletUser model (same as in WalletUser.js)
const walletUserSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isStaff: {
    type: Boolean,
    default: false
  },
  isSuperuser: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: null
  },
  dateJoined: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const WalletUser = mongoose.model('WalletUser', walletUserSchema);

async function cleanDatabase() {
  try {
    console.log('🧹 Cleaning database...');

    // Clean User collection
    console.log('Cleaning User collection...');
    const result1 = await User.deleteMany({ wallet_address: { $in: [null, ''] } });
    console.log(`Deleted ${result1.deletedCount} User documents with null/empty wallet_address`);

    const userDuplicates = await User.aggregate([
      { $group: { _id: '$wallet_address', count: { $sum: 1 }, docs: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } }
    ]);

    if (userDuplicates.length > 0) {
      console.log('Found User duplicates:');
      for (const dup of userDuplicates) {
        console.log(`wallet_address: ${dup._id}, count: ${dup.count}`);
        const toDelete = dup.docs.slice(1);
        const result2 = await User.deleteMany({ _id: { $in: toDelete } });
        console.log(`Deleted ${result2.deletedCount} duplicate User documents for ${dup._id}`);
      }
    }

    // Clean WalletUser collection
    console.log('Cleaning WalletUser collection...');
    const result3 = await WalletUser.deleteMany({ walletAddress: { $in: [null, ''] } });
    console.log(`Deleted ${result3.deletedCount} WalletUser documents with null/empty walletAddress`);

    const walletUserDuplicates = await WalletUser.aggregate([
      { $group: { _id: '$walletAddress', count: { $sum: 1 }, docs: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } }
    ]);

    if (walletUserDuplicates.length > 0) {
      console.log('Found WalletUser duplicates:');
      for (const dup of walletUserDuplicates) {
        console.log(`walletAddress: ${dup._id}, count: ${dup.count}`);
        const toDelete = dup.docs.slice(1);
        const result4 = await WalletUser.deleteMany({ _id: { $in: toDelete } });
        console.log(`Deleted ${result4.deletedCount} duplicate WalletUser documents for ${dup._id}`);
      }
    }

    console.log('✅ Database cleaned successfully');
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
  } finally {
    mongoose.connection.close();
  }
}

cleanDatabase();
