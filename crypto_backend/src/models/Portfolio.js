const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'WalletUser', required: true },
  coin: { type: mongoose.Schema.Types.ObjectId, ref: 'Coin', required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  total: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Portfolio', portfolioSchema);
