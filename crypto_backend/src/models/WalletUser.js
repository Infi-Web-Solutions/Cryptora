// models/WalletUser.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

// Hash password before saving
walletUserSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
walletUserSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('WalletUser', walletUserSchema);
