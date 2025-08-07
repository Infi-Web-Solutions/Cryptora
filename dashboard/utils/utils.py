from dashboard.web3 import PRIVATE_KEY, WALLET_ADDRESS, contract, web3
from web3 import Web3
from decimal import Decimal, getcontext
getcontext().prec = 18
# ---------- Borrow / Approval ----------
def is_user_registered(user_address):
    user_address = Web3.to_checksum_address(user_address)
    try:
        user_data = contract.functions.getUser(user_address).call()
        return user_data[0] != '0x0000000000000000000000000000000000000000'
    except Exception as e:
        return False

def get_all_pending_requests():
    addresses = contract.functions.getRegisteredUsers().call({'from': Web3.to_checksum_address(WALLET_ADDRESS)})
    pending = []
    for addr in addresses:
        addr = Web3.to_checksum_address(addr)
        amount = contract.functions.pendingRequests(addr).call({'from': Web3.to_checksum_address(WALLET_ADDRESS)})
        if amount > 0:
            pending.append({"wallet": addr, "amount": amount})
    return pending

def request_virtual_funds(amount):
    nonce = web3.eth.get_transaction_count(WALLET_ADDRESS)
    txn = contract.functions.requestVirtualUSD(amount).build_transaction({
        'from': WALLET_ADDRESS,
        'nonce': nonce,
        'gas': 200000,
        'gasPrice': web3.to_wei('20', 'gwei'),
        'chainId': 11155111
    })
    signed_txn = web3.eth.account.sign_transaction(txn, PRIVATE_KEY)
    tx_hash = web3.eth.send_raw_transaction(signed_txn.raw_transaction)
    return web3.to_hex(tx_hash)

def request_virtual_funds_for(user_address, amount):
    user_address = Web3.to_checksum_address(user_address)
    nonce = web3.eth.get_transaction_count(WALLET_ADDRESS)
    txn = contract.functions.requestVirtualUSDFor(user_address, amount).build_transaction({
        'from': WALLET_ADDRESS,
        'nonce': nonce,
        'gas': 200000,
        'gasPrice': web3.to_wei('20', 'gwei'),
        'chainId': 11155111
    })
    signed_txn = web3.eth.account.sign_transaction(txn, PRIVATE_KEY)
    tx_hash = web3.eth.send_raw_transaction(signed_txn.raw_transaction)
    return web3.to_hex(tx_hash)

def approve_virtual_funds(user_address):
    user_address = Web3.to_checksum_address(user_address)
    nonce = web3.eth.get_transaction_count(WALLET_ADDRESS)

    try:
        contract.functions.approveFunds(user_address).estimate_gas({'from': WALLET_ADDRESS})
    except Exception as e:
        error_message = str(e)
        return f"Gas estimation failed: {error_message}"

    txn = contract.functions.approveFunds(user_address).build_transaction({
        'from': WALLET_ADDRESS,
        'nonce': nonce,
        'gas': 300000,
        'gasPrice': web3.to_wei('20', 'gwei'),
        'chainId': 11155111
    })
    signed_txn = web3.eth.account.sign_transaction(txn, PRIVATE_KEY)
    tx_hash = web3.eth.send_raw_transaction(signed_txn.raw_transaction)
    return web3.to_hex(tx_hash)

def reject_virtual_funds(user_address):
    user_address = Web3.to_checksum_address(user_address)
    nonce = web3.eth.get_transaction_count(WALLET_ADDRESS)
    txn = contract.functions.rejectFunds(user_address).build_transaction({
        'from': WALLET_ADDRESS,
        'nonce': nonce,
        'gas': 100000,
        'gasPrice': web3.to_wei('20', 'gwei'),
        'chainId': 11155111
    })
    signed_txn = web3.eth.account.sign_transaction(txn, PRIVATE_KEY)
    tx_hash = web3.eth.send_raw_transaction(signed_txn.raw_transaction)
    return web3.to_hex(tx_hash)

def repay_virtual_funds(user_wallet, amount):
    user_wallet = Web3.to_checksum_address(user_wallet)
    nonce = web3.eth.get_transaction_count(WALLET_ADDRESS)
    txn = contract.functions.repayBorrowedAmount(amount).build_transaction({
        'from': user_wallet,
        'nonce': nonce,
        'gas': 150000,
        'gasPrice': web3.to_wei('20', 'gwei'),
        'chainId': 11155111
    })
    signed_txn = web3.eth.account.sign_transaction(txn, PRIVATE_KEY)
    tx_hash = web3.eth.send_raw_transaction(signed_txn.raw_transaction)
    return web3.to_hex(tx_hash)

# ---------- Coin Trading ----------
def buy_coin(user_wallet, symbol, price, quantity):
    symbol = symbol.upper()
    user_wallet = Web3.to_checksum_address(user_wallet)
    nonce = web3.eth.get_transaction_count(WALLET_ADDRESS)
    # Debug: Check registration and balance before transaction
    try:
        is_registered = contract.functions.registered(user_wallet).call()
    except Exception as e:
        pass
    try:
        usd_balance = contract.functions.getUSDBalance(user_wallet).call()
    except Exception as e:
        pass
    try:
        holdings = contract.functions.getUserHoldings(user_wallet).call()
    except Exception as e:
        pass
    txn = contract.functions.buyCoinFor(user_wallet, symbol, int(price), quantity).build_transaction({
        'from': WALLET_ADDRESS,
        'nonce': nonce,
        'gas': 250000,
        'gasPrice': web3.to_wei('20', 'gwei'),
        'chainId': 11155111
    })
    signed_txn = web3.eth.account.sign_transaction(txn, PRIVATE_KEY)
    tx_hash = web3.eth.send_raw_transaction(signed_txn.raw_transaction)
    # Debug: Check holdings after buy (may need to wait for confirmation in production)
    try:
        holdings_after = contract.functions.getUserHoldings(user_wallet).call()
    except Exception as e:
        pass
    return web3.to_hex(tx_hash)

def sell_coin(user_wallet, symbol, price, quantity):
    symbol = symbol.upper()
    user_wallet = Web3.to_checksum_address(user_wallet)
    nonce = web3.eth.get_transaction_count(WALLET_ADDRESS)
    txn = contract.functions.sellCoinFor(user_wallet, symbol, int(price), quantity).build_transaction({
        'from': WALLET_ADDRESS,
        'nonce': nonce,
        'gas': 250000,
        'gasPrice': web3.to_wei('20', 'gwei'),
        'chainId': 11155111
    })
    signed_txn = web3.eth.account.sign_transaction(txn, PRIVATE_KEY)
    tx_hash = web3.eth.send_raw_transaction(signed_txn.raw_transaction)
    return web3.to_hex(tx_hash)

# ---------- Watchlist ----------
def add_to_watchlist(user_address, symbol):
    symbol = symbol.upper()
    user_address = Web3.to_checksum_address(user_address)
    # NOTE: This requires access to the user's private key, which is not secure for production. For demo/testing only.
    try:
        from dashboard.web3 import PRIVATE_KEY as USER_PRIVATE_KEY  # Replace with actual user key management
    except ImportError:
        return None
    nonce = web3.eth.get_transaction_count(user_address)
    txn = contract.functions.addToWatchlist(symbol).build_transaction({
        'from': user_address,
        'nonce': nonce,
        'gas': 100000,
        'gasPrice': web3.to_wei('20', 'gwei'),
        'chainId': 11155111
    })
    signed_txn = web3.eth.account.sign_transaction(txn, USER_PRIVATE_KEY)
    tx_hash = web3.eth.send_raw_transaction(signed_txn.raw_transaction)
    return web3.to_hex(tx_hash)

def remove_from_watchlist(user_address, symbol):
    symbol = symbol.upper()
    user_address = Web3.to_checksum_address(user_address)
    try:
        nonce = web3.eth.get_transaction_count(user_address)
    except Exception as e:
        pass
    try:
        from dashboard.web3 import PRIVATE_KEY as USER_PRIVATE_KEY  # Replace with actual user key management
    except ImportError:
        pass
    txn = contract.functions.removeFromWatchlist(symbol).build_transaction({
        'from': user_address,
        'nonce': nonce,
        'gas': 100000,
        'gasPrice': web3.to_wei('20', 'gwei'),
        'chainId': 11155111
    })
    signed_txn = web3.eth.account.sign_transaction(txn, USER_PRIVATE_KEY)
    tx_hash = web3.eth.send_raw_transaction(signed_txn.raw_transaction)
    return web3.to_hex(tx_hash)

def get_watchlist(user_address):
    user_address = Web3.to_checksum_address(user_address)
    try:
        watchlist = contract.functions.getWatchlist(user_address).call()
        return watchlist
    except Exception as e:
        return []
# ---------- Getters ----------
def get_virtual_balance(user_address):
    user_address = Web3.to_checksum_address(user_address)
    return contract.functions.getUSDBalance(user_address).call()

def get_borrowed_amount(user_address):
    user_address = Web3.to_checksum_address(user_address)
    return contract.functions.getBorrowedAmount(user_address).call()

def get_coin_balance(user_address, symbol):
    user_address = Web3.to_checksum_address(user_address)
    symbol = symbol.upper()
    return contract.functions.getCoinBalance(user_address, symbol).call()

def get_transaction_history(user_wallet):
    user_wallet = Web3.to_checksum_address(user_wallet)
    return contract.functions.getTransactionHistory().call({'from': user_wallet})

# ---------- Registration ----------
def register_user():
    nonce = web3.eth.get_transaction_count(WALLET_ADDRESS)
    txn = contract.functions.register().build_transaction({
        'from': WALLET_ADDRESS,
        'nonce': nonce,
        'gas': 100000,
        'gasPrice': web3.to_wei('20', 'gwei'),
        'chainId': 11155111
    })
    signed_txn = web3.eth.account.sign_transaction(txn, PRIVATE_KEY)
    tx_hash = web3.eth.send_raw_transaction(signed_txn.raw_transaction)
    return web3.to_hex(tx_hash)

def admin_register_user(user_address):
    user_address = Web3.to_checksum_address(user_address)
    nonce = web3.eth.get_transaction_count(WALLET_ADDRESS)
    txn = contract.functions.adminRegister(user_address).build_transaction({
        'from': WALLET_ADDRESS,
        'nonce': nonce,
        'gas': 200000,
        'gasPrice': web3.to_wei('20', 'gwei'),
        'chainId': 11155111
    })
    signed_txn = web3.eth.account.sign_transaction(txn, PRIVATE_KEY)
    tx_hash = web3.eth.send_raw_transaction(signed_txn.raw_transaction)
    return web3.to_hex(tx_hash)

def get_all_registered_users():
    addresses = set()
    try:
        user_list = contract.functions.getRegisteredUsers().call({'from': WALLET_ADDRESS})
        for addr in user_list:
            addresses.add(Web3.to_checksum_address(addr))
    except Exception as e:
        pass

    try:
        i = 0
        while True:
            addr = contract.functions.registeredUsers(i).call()
            addresses.add(Web3.to_checksum_address(addr))
            i += 1
    except Exception:
        pass

    registered = []
    for addr in addresses:
        try:
            if contract.functions.registered(addr).call():
                registered.append(addr)
        except Exception:
            continue
    return registered

# ---------- Admin Update (Optional) ----------
def update_admin(new_admin_address):
    new_admin_address = Web3.to_checksum_address(new_admin_address)
    nonce = web3.eth.get_transaction_count(WALLET_ADDRESS)
    txn = contract.functions.updateAdmin(new_admin_address).build_transaction({
        'from': WALLET_ADDRESS,
        'nonce': nonce,
        'gas': 100000,
        'gasPrice': web3.to_wei('20', 'gwei'),
        'chainId': 11155111
    })
    signed_txn = web3.eth.account.sign_transaction(txn, PRIVATE_KEY)
    tx_hash = web3.eth.send_raw_transaction(signed_txn.raw_transaction)
    return web3.to_hex(tx_hash)
def get_user_holdings(user_wallet):
    user_wallet = Web3.to_checksum_address(user_wallet)
    symbols, amounts = contract.functions.getUserHoldings(user_wallet).call()
    holdings = list(zip(symbols, amounts))
    return holdings
def get_coin_holdings(user_wallet):
    user_wallet = Web3.to_checksum_address(user_wallet)
    symbols, amounts = contract.functions.getUserHoldings(user_wallet).call()
    holdings = []
    for symbol, amount in zip(symbols, amounts):
        holdings.append({
            'symbol': symbol,
            'amount': Web3.from_wei(amount, 'ether')
        })
    return holdings
def get_avg_buy_price(user_wallet, symbol):
    """
    Calculates average buy price based on CoinBought event logs (chunked for provider limits).
    """
    from web3 import Web3
    DEPLOY_BLOCK = 8819605  # Set this to your contract's actual deploy block
    latest_block = web3.eth.block_number
    chunk_size = 500
    total_quantity = Decimal("0.0")
    total_spent = Decimal("0.0")
    user_wallet = Web3.to_checksum_address(user_wallet)
    for start in range(DEPLOY_BLOCK, latest_block + 1, chunk_size):
        end = min(start + chunk_size - 1, latest_block)
        try:
            buy_logs = contract.events.CoinBought().get_logs(from_block=start, to_block=end, argument_filters={'user': user_wallet})
            for event in buy_logs:
                event_symbol = event['args']['symbol'].upper()
                if event_symbol != symbol.upper():
                    continue
                quantity = Decimal(str(event['args']['quantity']))
                # Prefer totalCost if available, else fallback to pricePerToken * quantity
                if 'totalCost' in event['args']:
                    spent = Decimal(str(event['args']['totalCost'])) / Decimal('100')
                elif 'pricePerToken' in event['args']:
                    spent = quantity * (Decimal(str(event['args']['pricePerToken'])) / Decimal('100'))
                else:
                    spent = quantity
                total_quantity += quantity
                total_spent += spent
        except Exception as e:
            pass
    if total_quantity > 0:
        return float(total_spent / total_quantity)
    return 0.0

# ---------- Live Price Fetcher ----------
import requests
def get_live_price(symbol):
    symbol = symbol.upper()
    # Try Binance API first
    binance_map = {
        'BNB': 'BNBUSDT',
        'USDT': 'USDTUSDT',
        'XRP': 'XRPUSDT',
        'SOL': 'SOLUSDT',
        'BTC': 'BTCUSDT',
        'ETH': 'ETHUSDT',
        'STETH': 'STETHUSDT',
        'ADA': 'ADAUSDT',
        'DOGE': 'DOGEUSDT',
        'DOT': 'DOTUSDT',
        'MATIC': 'MATICUSDT',
        'CRV': 'CRVUSDT',
        # Add more mappings as needed
    }
    binance_symbol = binance_map.get(symbol, f"{symbol}USDT")  # Default to symbol + USDT
    url = f'https://api.binance.com/api/v3/ticker/price?symbol={binance_symbol}'
    try:
        resp = requests.get(url, timeout=5)
        data = resp.json()
        return float(data['price'])
    except Exception as e:
        print(f"[get_live_price] Binance API error: {e}")
    # Fallback to CoinGecko
    coingecko_map = {
        'BNB': 'binancecoin',
        'USDT': 'tether',
        'XRP': 'ripple',
        'SOL': 'solana',
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'STETH': 'staked-ether',
        'ADA': 'cardano',
        'DOGE': 'dogecoin',
        'DOT': 'polkadot',
        'MATIC': 'matic-network',
        'CRV': 'curve-dao-token',
        # Add more mappings as needed
    }
    coingecko_id = coingecko_map.get(symbol, symbol.lower())  # Default to lowercase symbol
    url = f'https://api.coingecko.com/api/v3/simple/price?ids={coingecko_id}&vs_currencies=usd'
    try:
        resp = requests.get(url, timeout=5)
        data = resp.json()
        return float(data[coingecko_id]['usd'])
    except Exception as e:
        print(f"[get_live_price] CoinGecko API error: {e}")
    return 0.0

from datetime import datetime
from web3 import Web3

def get_user_trade_events(user_wallet, contract, web3):
    user_wallet = Web3.to_checksum_address(user_wallet)
    DEPLOY_BLOCK = 8819605  # Set this to your contract's actual deploy block
    # Use 'user' as the argument name, matching your event's indexed argument
    # CoinBought: user is indexed, so we can filter
    try:
        buy_events = contract.events.CoinBought().get_logs(
            from_block=DEPLOY_BLOCK,
            to_block='latest',
            argument_filters={'user': user_wallet}
        )
    except Exception as e:
        buy_events = []

    # CoinSold: user is NOT indexed, so we CANNOT filter in the query
    try:
        latest_block = web3.eth.block_number
        chunk_size = 5000
        sell_events_all = []
        for start in range(DEPLOY_BLOCK, latest_block + 1, chunk_size):
            end = min(start + chunk_size - 1, latest_block)
            try:
                chunk_events = contract.events.CoinSold().get_logs(
                    from_block=start,
                    to_block=end
                )
                sell_events_all.extend(chunk_events)
            except Exception as e:
                pass
        # Filter in Python
        sell_events = [event for event in sell_events_all if event['args'].get('user', '').lower() == user_wallet.lower()]
    except Exception as e:
        sell_events = []

    txs = []
    for event in buy_events:
        txs.append({
            'type': 'buy',
            'symbol': event['args']['symbol'],
            'amount': event['args']['quantity'],
            'timestamp': int(web3.eth.get_block(event['blockNumber'])['timestamp']),
            'tx_hash': event['transactionHash'].hex(),
        })
    for event in sell_events:
        txs.append({
            'type': 'sell',
            'symbol': event['args']['symbol'],
            'amount': event['args']['quantity'],
            'timestamp': int(web3.eth.get_block(event['blockNumber'])['timestamp']),
            'tx_hash': event['transactionHash'].hex(),
        })
    return txs

