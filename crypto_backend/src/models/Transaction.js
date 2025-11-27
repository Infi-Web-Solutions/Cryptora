const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'WalletUser', required: true },
  type: {
    type: String,
    enum: ['buy', 'sell', 'fund', 'repay'],
    required: true
  },
  symbol: { type: String, maxlength: 20, default: null },
  quantity: { type: mongoose.Types.Decimal128, default: 0 },
  usd_value: { type: mongoose.Types.Decimal128, default: 0 },
  buy_price: { type: mongoose.Types.Decimal128, default: null },
  timestamp: { type: Date, required: true },
  tx_hash: { type: String, maxlength: 66, default: null }
}, {
  timestamps: true
});

transactionSchema.index({ timestamp: -1 }); // ordering like Django Meta: ordering = ['-timestamp']

transactionSchema.methods.toString = function() {
  return `${this.user.wallet_address} ${this.type} ${this.quantity} ${this.symbol} at ${this.timestamp}`;
};

module.exports = mongoose.model('Transaction', transactionSchema);
