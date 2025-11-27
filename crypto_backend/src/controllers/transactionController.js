const { web3, contract, toChecksumAddress } = require('../utils/web3');
const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const BuyPrice = require('../models/BuyPrice');

/**
 * Get transaction history for a user wallet
 * Matches the Django logic for fetching and processing all transaction data
 * @route GET /api/transactions
 */
async function getTransactionHistory(req, res) {
  try {
    const userWallet = req.user?.wallet_address?.toLowerCase() ||
                       req.query.wallet?.toLowerCase() ||
                       req.headers['wallet-address']?.toLowerCase();

    if (!userWallet) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    const checksumWallet = toChecksumAddress(userWallet);

    // Find user
    let user = await User.findOne({
      wallet_address: new RegExp(`^${userWallet}$`, 'i')
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        wallet: checksumWallet
      });
    }

    console.log(`[INFO] Fetching transactions for user: ${checksumWallet}`);

    // Get basic contract transactions (similar to get_transaction_history in Django)
    let contractTransactions = [];
    try {
      // This would be replaced with actual contract call to get transaction history
      // For now, we'll assume we have a way to get basic transactions
      contractTransactions = []; // Placeholder
    } catch (error) {
      console.error('[ERROR] Error fetching contract transactions:', error.message);
      contractTransactions = [];
    }

    // Fetch blockchain events for enrichment (matching Django logic)
    const enrichedData = await fetchBlockchainEvents(checksumWallet, req.query);

    // Process and merge all transaction data
    const allTransactions = await processAndMergeTransactions(user, contractTransactions, enrichedData);

    // Apply filters
    let filteredTransactions = allTransactions;

    // Filter by type
    const txType = req.query.type;
    if (txType) {
      filteredTransactions = filteredTransactions.filter(tx => tx.type === txType);
      console.log(`[INFO] Filtered to ${filteredTransactions.length} transactions of type: ${txType}`);
    }

    // Filter by date range
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;

    if (startDate) {
      try {
        const startDt = new Date(startDate);
        filteredTransactions = filteredTransactions.filter(tx => new Date(tx.timestamp) >= startDt);
      } catch (error) {
        console.error('[ERROR] Invalid start_date format:', error.message);
      }
    }

    if (endDate) {
      try {
        const endDt = new Date(endDate);
        filteredTransactions = filteredTransactions.filter(tx => new Date(tx.timestamp) <= endDt);
      } catch (error) {
        console.error('[ERROR] Invalid end_date format:', error.message);
      }
    }

    // Remove transactions with zero USD value
    filteredTransactions = filteredTransactions.filter(tx =>
      tx.usd_value !== null && tx.usd_value !== undefined && parseFloat(tx.usd_value) !== 0
    );

    console.log(`[INFO] Returning ${filteredTransactions.length} transactions`);

    // Return response matching portfolio API format
    return res.json({
      success: true,
      wallet: checksumWallet,
      transactions: filteredTransactions,
      total: filteredTransactions.length
    });

  } catch (error) {
    console.error('[ERROR] Failed to fetch transaction history:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch transaction history',
      details: error.message
    });
  }
}

/**
 * Fetch blockchain events for enrichment (matching Django logic)
 */
async function fetchBlockchainEvents(checksumWallet, queryParams = {}) {
  try {
    const DEPLOY_BLOCK = 9333940; // Match Django deploy block
    const chunkSize = 2000;
    const deep = queryParams.deep === '1';
    const blocks = Math.min(parseInt(queryParams.blocks) || 1000, 50000);
    const latestBlock = Number(await web3.eth.getBlockNumber());
    const fromBlock = deep ? DEPLOY_BLOCK : Math.max(DEPLOY_BLOCK, latestBlock - blocks);

    console.log(`[DEBUG] Fetching blockchain events from block ${fromBlock} to ${latestBlock}`);

    const buyEvents = [];
    const sellEvents = [];

    // Fetch CoinBought events in chunks
    let start = fromBlock;
    let processed = 0;
    while (start <= latestBlock) {
      const end = Math.min(start + chunkSize - 1, latestBlock);
      try {
        const events = await contract.events.CoinBought().get_logs({
          fromBlock: start,
          toBlock: end
        });

        for (const event of events) {
          if (event.args.user?.toLowerCase() !== checksumWallet.toLowerCase()) continue;

          const block = await web3.eth.getBlock(event.blockNumber);
          const timestamp = Number(block.timestamp);
          const symbol = event.args.symbol?.toUpperCase() || '';
          const amount = event.args.quantity;
          const args = event.args;
          let usdValue = 0;

          if (args.totalCost && args.totalCost !== null) {
            usdValue = parseFloat(args.totalCost) / 100.0;
          } else if (amount) {
            usdValue = parseFloat(amount);
          }

          buyEvents.push({
            type: 'buy',
            symbol: symbol,
            amount: amount,
            timestamp: timestamp,
            usd_value: usdValue,
            tx_hash: typeof event.transactionHash === 'string' ? event.transactionHash :
                     event.transactionHash?.hex || event.transactionHash?.toString() || ''
          });
          processed++;
        }
      } catch (error) {
        console.error(`[ERROR] Error fetching CoinBought from ${start} to ${end}:`, error.message);
      }

      if (!deep && processed >= 2000) break;
      if (!deep && buyEvents.length > 300) break;
      start = end + 1;
    }

    // Fetch CoinSold events
    start = fromBlock;
    processed = 0;
    while (start <= latestBlock) {
      const end = Math.min(start + chunkSize - 1, latestBlock);
      try {
        const events = await contract.events.CoinSold().get_logs({
          fromBlock: start,
          toBlock: end
        });

        for (const event of events) {
          if (event.args.user?.toLowerCase() !== checksumWallet.toLowerCase()) continue;

          const block = await web3.eth.getBlock(event.blockNumber);
          const timestamp = Number(block.timestamp);
          const symbol = event.args.symbol?.toUpperCase() || '';
          const amount = event.args.quantity;

          sellEvents.push({
            type: 'sell',
            symbol: symbol,
            amount: amount,
            timestamp: timestamp,
            usd_value: parseFloat(amount || 0),
            tx_hash: typeof event.transactionHash === 'string' ? event.transactionHash :
                     event.transactionHash?.hex || event.transactionHash?.toString() || ''
          });
          processed++;
        }
      } catch (error) {
        console.error(`[ERROR] Error fetching CoinSold from ${start} to ${end}:`, error.message);
      }

      if (!deep && processed >= 2000) break;
      start = end + 1;
    }

    // Fetch FundsApproved events
    const approvals = [];
    start = fromBlock;
    processed = 0;
    while (start <= latestBlock) {
      const end = Math.min(start + chunkSize - 1, latestBlock);
      try {
        const events = await contract.events.FundsApproved().get_logs({
          fromBlock: start,
          toBlock: end
        });

        for (const event of events) {
          if (event.args.user?.toLowerCase() !== checksumWallet.toLowerCase()) continue;

          const block = await web3.eth.getBlock(event.blockNumber);
          const timestamp = Number(block.timestamp);
          const amountCents = parseFloat(event.args.amount || 0);

          approvals.push({
            type: 'fund',
            symbol: 'USD',
            quantity: amountCents,
            timestamp: timestamp,
            buy_price: null,
            usd_value: amountCents / 100.0,
            tx_hash: typeof event.transactionHash === 'string' ? event.transactionHash :
                     event.transactionHash?.hex || event.transactionHash?.toString() || ''
          });
          processed++;
        }
      } catch (error) {
        console.error(`[ERROR] Error fetching FundsApproved from ${start} to ${end}:`, error.message);
      }

      if (!deep && processed >= 2000) break;
      start = end + 1;
    }

    // Fetch Repaid events
    const repayments = [];
    start = fromBlock;
    processed = 0;
    while (start <= latestBlock) {
      const end = Math.min(start + chunkSize - 1, latestBlock);
      try {
        const events = await contract.events.Repaid().get_logs({
          fromBlock: start,
          toBlock: end
        });

        for (const event of events) {
          if (event.args.user?.toLowerCase() !== checksumWallet.toLowerCase()) continue;

          const block = await web3.eth.getBlock(event.blockNumber);
          const timestamp = Number(block.timestamp);
          const amountCents = parseFloat(event.args.amount || 0);

          repayments.push({
            type: 'repay',
            symbol: 'USD',
            amount: amountCents,
            timestamp: timestamp,
            usd_value: amountCents / 100.0,
            tx_hash: typeof event.transactionHash === 'string' ? event.transactionHash :
                     event.transactionHash?.hex || event.transactionHash?.toString() || ''
          });
          processed++;
        }
      } catch (error) {
        console.error(`[ERROR] Error fetching Repaid from ${start} to ${end}:`, error.message);
      }

      if (!deep && processed >= 2000) break;
      start = end + 1;
    }

    return {
      buyEvents,
      sellEvents: [...sellEvents, ...approvals, ...repayments]
    };

  } catch (error) {
    console.error('[ERROR] Error fetching blockchain events:', error);
    return { buyEvents: [], sellEvents: [] };
  }
}

/**
 * Process and merge all transaction data (matching Django logic)
 */
async function processAndMergeTransactions(user, contractTransactions, enrichedData) {
  try {
    const { buyEvents, sellEvents } = enrichedData;

    // Convert contract transactions to dicts
    const contractTxs = contractTransactions.map(tx => ({
      type: tx[0],
      symbol: tx[1],
      quantity: tx[2],
      timestamp: tx[3],
      buy_price: null,
      usd_value: tx[2],
      tx_hash: ''
    }));

    // Process buy events
    for (const event of buyEvents) {
      event.quantity = event.amount;
      delete event.amount;
      if (event.quantity && event.usd_value) {
        event.buy_price = parseFloat(event.usd_value) / parseFloat(event.quantity);
        event.usd_value = parseFloat(event.quantity) * event.buy_price;
      } else {
        event.buy_price = null;
      }
    }

    // Process sell events
    for (const event of sellEvents) {
      event.quantity = event.amount || event.quantity;
      delete event.amount;

      // For sell, use the latest buy price for that symbol
      let buyPrice = null;
      const relevantBuys = buyEvents
        .filter(e => e.symbol === event.symbol && e.timestamp <= event.timestamp)
        .sort((a, b) => b.timestamp - a.timestamp);

      if (relevantBuys.length > 0) {
        buyPrice = relevantBuys[0].buy_price;
      }

      event.buy_price = buyPrice;
      if (buyPrice !== null) {
        event.usd_value = parseFloat(event.quantity) * buyPrice;
      }
    }

    const allTxs = [...contractTxs, ...buyEvents, ...sellEvents]
      .sort((a, b) => b.timestamp - a.timestamp);

    // Save/update transactions in database
    for (const tx of allTxs) {
      const timestamp = new Date(tx.timestamp * 1000);

      const existingQuery = {
        user: user._id,
        type: tx.type,
        symbol: tx.symbol,
        quantity: tx.quantity,
        timestamp: timestamp
      };

      const existingTx = await Transaction.findOne(existingQuery);

      if (existingTx) {
        // Update if tx_hash is missing
        if (tx.tx_hash && !existingTx.tx_hash) {
          existingTx.tx_hash = tx.tx_hash;
          if (tx.usd_value) existingTx.usd_value = tx.usd_value;
          if (tx.buy_price) existingTx.buy_price = tx.buy_price;
          await existingTx.save();
          console.log(`[DEBUG] Updated existing TX id=${existingTx._id} with tx_hash=${tx.tx_hash}`);
        }
        continue;
      }

      // Create new transaction
      await Transaction.create({
        user: user._id,
        type: tx.type,
        symbol: tx.symbol,
        quantity: tx.quantity,
        usd_value: tx.usd_value,
        buy_price: tx.buy_price,
        timestamp: timestamp,
        tx_hash: tx.tx_hash || ''
      });
    }

    // Query from database with buy_price fallback logic
    const dbTransactions = await Transaction.find({ user: user._id }).sort({ timestamp: -1 });

    const processedTransactions = [];
    for (const tx of dbTransactions) {
      let buyPriceVal = null;

      try {
        if (tx.buy_price !== null && tx.buy_price !== undefined) {
          buyPriceVal = parseFloat(tx.buy_price);
        } else if (tx.type === 'sell' && tx.symbol) {
          // Fallback to BuyPrice model average
          const buyPriceRecord = await BuyPrice.findOne({
            user: user._id,
            symbol: tx.symbol.toUpperCase()
          });

          if (buyPriceRecord) {
            buyPriceVal = parseFloat(buyPriceRecord.average_price_usd || buyPriceRecord.price_usd || 0);
          }
        }
      } catch (error) {
        console.error('[ERROR] Error calculating buy_price:', error.message);
        buyPriceVal = null;
      }

      processedTransactions.push({
        type: tx.type,
        symbol: tx.symbol,
        quantity: parseFloat(tx.quantity || 0),
        usd_value: parseFloat(tx.usd_value || 0),
        buy_price: buyPriceVal,
        timestamp: tx.timestamp.toISOString(),
        tx_hash: tx.tx_hash || ''
      });
    }

    return processedTransactions;

  } catch (error) {
    console.error('[ERROR] Error processing and merging transactions:', error);
    return [];
  }
}

/**
 * Sync transactions from blockchain events to database (legacy function)
 */
async function syncTransactionsFromBlockchain(user, checksumWallet) {
  try {
    const DEPLOY_BLOCK = 8819605;
    const BLOCKS_PER_BATCH = 5000;

    const currentBlockBigInt = await web3.eth.getBlockNumber();
    const currentBlock = Number(currentBlockBigInt);

    console.log(`[DEBUG] Syncing events from block ${DEPLOY_BLOCK} to ${currentBlock}`);

    const fetchEventsInBatches = async (eventName, filterParams) => {
      const allEvents = [];
      let fromBlock = DEPLOY_BLOCK;

      while (fromBlock <= currentBlock) {
        const toBlock = Math.min(fromBlock + BLOCKS_PER_BATCH - 1, currentBlock);

        try {
          const events = await contract.getPastEvents(eventName, {
            filter: filterParams,
            fromBlock: fromBlock,
            toBlock: toBlock
          });

          allEvents.push(...events);

          if (events.length > 0) {
            console.log(`[DEBUG] Fetched ${events.length} ${eventName} events from ${fromBlock} to ${toBlock}`);
          }
        } catch (error) {
          console.error(`[ERROR] Error fetching ${eventName} from ${fromBlock} to ${toBlock}:`, error.message);
        }

        fromBlock = toBlock + 1;
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      return allEvents;
    };

    console.log('[DEBUG] Fetching buy events...');
    const buyEvents = await fetchEventsInBatches('CoinBought', { user: checksumWallet });

    console.log('[DEBUG] Fetching sell events...');
    const sellEvents = await fetchEventsInBatches('CoinSold', { user: checksumWallet });

    console.log('[DEBUG] Fetching request events...');
    const requestEvents = await fetchEventsInBatches('RequestFunds', { user: checksumWallet });

    console.log('[DEBUG] Fetching approve events...');
    const approveEvents = await fetchEventsInBatches('FundsApproved', { user: checksumWallet });

    console.log('[DEBUG] Fetching repay events...');
    const repayEvents = await fetchEventsInBatches('Repaid', { user: checksumWallet });

    const bulkOps = [];

    // Process BUY events
    for (const event of buyEvents) {
      const block = await web3.eth.getBlock(event.blockNumber);
      const quantity = parseInt(event.returnValues.quantity);
      const totalCost = parseInt(event.returnValues.totalCost) / 100;

      bulkOps.push({
        updateOne: {
          filter: { tx_hash: event.transactionHash },
          update: {
            $set: {
              user: user._id,
              type: 'buy',
              symbol: event.returnValues.symbol,
              quantity: new mongoose.Types.Decimal128(quantity.toString()),
              usd_value: new mongoose.Types.Decimal128(totalCost.toString()),
              buy_price: quantity > 0 ? new mongoose.Types.Decimal128((totalCost / quantity).toString()) : null,
              timestamp: new Date(Number(block.timestamp) * 1000),
              tx_hash: event.transactionHash
            }
          },
          upsert: true
        }
      });
    }

    // Process SELL events
    for (const event of sellEvents) {
      const block = await web3.eth.getBlock(event.blockNumber);
      const quantity = parseInt(event.returnValues.quantity);
      const totalValue = parseInt(event.returnValues.totalValue || 0) / 100;

      bulkOps.push({
        updateOne: {
          filter: { tx_hash: event.transactionHash },
          update: {
            $set: {
              user: user._id,
              type: 'sell',
              symbol: event.returnValues.symbol,
              quantity: new mongoose.Types.Decimal128(quantity.toString()),
              usd_value: new mongoose.Types.Decimal128(totalValue.toString()),
              timestamp: new Date(Number(block.timestamp) * 1000),
              tx_hash: event.transactionHash
            }
          },
          upsert: true
        }
      });
    }

    // Process REQUEST events
    for (const event of requestEvents) {
      const block = await web3.eth.getBlock(event.blockNumber);
      const amount = parseInt(event.returnValues.amount) / 100;

      bulkOps.push({
        updateOne: {
          filter: { tx_hash: event.transactionHash },
          update: {
            $set: {
              user: user._id,
              type: 'fund',
              symbol: 'USD',
              quantity: new mongoose.Types.Decimal128(amount.toString()),
              usd_value: new mongoose.Types.Decimal128(amount.toString()),
              timestamp: new Date(Number(block.timestamp) * 1000),
              tx_hash: event.transactionHash
            }
          },
          upsert: true
        }
      });
    }

    // Process APPROVE events
    for (const event of approveEvents) {
      const block = await web3.eth.getBlock(event.blockNumber);
      const amount = parseInt(event.returnValues.amount) / 100;

      bulkOps.push({
        updateOne: {
          filter: { tx_hash: event.transactionHash },
          update: {
            $set: {
              user: user._id,
              type: 'fund',
              symbol: 'USD',
              quantity: new mongoose.Types.Decimal128(amount.toString()),
              usd_value: new mongoose.Types.Decimal128(amount.toString()),
              timestamp: new Date(Number(block.timestamp) * 1000),
              tx_hash: event.transactionHash
            }
          },
          upsert: true
        }
      });
    }

    // Process REPAY events
    for (const event of repayEvents) {
      const block = await web3.eth.getBlock(event.blockNumber);
      const amount = parseInt(event.returnValues.amount) / 100;

      bulkOps.push({
        updateOne: {
          filter: { tx_hash: event.transactionHash },
          update: {
            $set: {
              user: user._id,
              type: 'repay',
              symbol: 'USD',
              quantity: new mongoose.Types.Decimal128(amount.toString()),
              usd_value: new mongoose.Types.Decimal128(amount.toString()),
              timestamp: new Date(Number(block.timestamp) * 1000),
              tx_hash: event.transactionHash
            }
          },
          upsert: true
        }
      });
    }

    if (bulkOps.length > 0) {
      await Transaction.bulkWrite(bulkOps);
      console.log(`[INFO] Successfully synced ${bulkOps.length} transactions to database`);
    } else {
      console.log('[INFO] No new transactions to sync');
    }

  } catch (error) {
    console.error('[ERROR] Error syncing transactions:', error);
    throw error;
  }
}

module.exports = {
  getTransactionHistory,
  syncTransactionsFromBlockchain
};