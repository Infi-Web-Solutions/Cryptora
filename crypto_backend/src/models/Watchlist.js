const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'WalletUser', required: true },
  coin: { type: mongoose.Schema.Types.ObjectId, ref: 'Coin', required: true }
}, { timestamps: true });

watchlistSchema.index({ user: 1, coin: 1 }, { unique: true });

module.exports = mongoose.model('Watchlist', watchlistSchema);
