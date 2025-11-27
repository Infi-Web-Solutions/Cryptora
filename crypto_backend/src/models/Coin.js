const mongoose = require('mongoose');

const coinSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 50 },
  symbol: { type: String, required: true, maxlength: 20 },
  coingecko_id: { type: String, required: true, unique: true, maxlength: 100 },
  current_price: { type: Number, default: 0.0 },
  image: { type: String, default: '', trim: true }
}, { timestamps: true });

coinSchema.methods.toString = function() {
  return `${this.name} (${this.symbol.toUpperCase()})`;
};

module.exports = mongoose.model('Coin', coinSchema);
