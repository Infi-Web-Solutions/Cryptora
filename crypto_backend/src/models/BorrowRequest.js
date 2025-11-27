const mongoose = require('mongoose');

const borrowRequestSchema = new mongoose.Schema({
  wallet: { type: String, required: true, maxlength: 100 },
  amount: { type: mongoose.Types.Decimal128, required: true },
  status: { type: String, default: 'pending', maxlength: 20 },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BorrowRequest', borrowRequestSchema);
