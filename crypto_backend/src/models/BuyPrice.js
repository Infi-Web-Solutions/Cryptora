const mongoose = require('mongoose');

const buyPriceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'WalletUser', required: true },
  symbol: { type: String, required: true, maxlength: 20 },
  price_usd: { type: Number, required: true },
  total_quantity: { type: Number, default: 0.0 },
  total_cost_usd: { type: Number, default: 0.0 },
  average_price_usd: { type: Number, default: 0.0 }
}, { timestamps: true });

buyPriceSchema.index({ user: 1, symbol: 1 }, { unique: true });

buyPriceSchema.methods.toString = function() {
  return `${this.user}:${this.symbol} -> $${this.price_usd}`;
};

const BuyPrice = mongoose.models.BuyPrice || mongoose.model('BuyPrice', buyPriceSchema);
module.exports = BuyPrice;
