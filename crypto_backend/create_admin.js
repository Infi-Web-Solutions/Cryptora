const readline = require('readline');
const WalletUser = require('./src/models/WalletUser');
const { toChecksumAddress } = require('./src/utils/web3');
const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crypto_platform');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const rl = readline.createInterface({ 
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const createSuperuser = async () => {
  try {
    await connectDB();

    console.log('Creating superuser...');

    // Use default values for testing
    const walletAddress = process.env.ADMIN_WALLET || "0x16d3ACbD38aa841DB2Da166041e99C9d3cb98750";
    const password = process.env.ADMIN_PASSWORD || "admin123";

    console.log(`Using wallet: ${walletAddress}`);
    console.log(`Using password: ${password}`);

    const checksumAddress = toChecksumAddress(walletAddress);
    if (!checksumAddress) {
      console.error('Invalid wallet address format');
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await WalletUser.findOne({ walletAddress: checksumAddress.toLowerCase() });
    if (existingUser) {
      console.error('User with this wallet address already exists');
      process.exit(1);
    }

    // Create superuser
    const superuser = new WalletUser({
      walletAddress: checksumAddress.toLowerCase(),
      password: password, // Will be hashed by pre-save hook
      isSuperuser: true,
      isStaff: true
    });

    await superuser.save();

    console.log(`Superuser created successfully for wallet: ${checksumAddress}`);
    console.log('You can now login as admin with these credentials.');

  } catch (error) {
    console.error('Error creating superuser:', error);
  } finally {
    rl.close();
    mongoose.connection.close();
  }
};

createSuperuser();
