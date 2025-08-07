from django.http import Http404
from django.shortcuts import render, redirect
from django.views.decorators.csrf import csrf_exempt
from django.contrib import messages
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required, user_passes_test
import requests
from web3 import Web3
from dashboard.web3 import contract, WALLET_ADDRESS, web3
from django.core.cache import cache
import logging

from .models import WalletUser
from user.decorators import wallet_login_required
from dashboard.utils.utils import (
    approve_virtual_funds,
    get_all_pending_requests,
    get_avg_buy_price,
    get_borrowed_amount,
    get_transaction_history,
    get_virtual_balance,
    get_watchlist,
    get_coin_balance,
    reject_virtual_funds,
    repay_virtual_funds,
    request_virtual_funds,
    get_live_price,  # Import the live price function from utils
)

logger = logging.getLogger(__name__)

def is_admin_address(user):
    try:
        wallet = user.wallet_address
        admin_address = contract.functions.admin().call()
        return Web3.to_checksum_address(wallet) == Web3.to_checksum_address(admin_address)
    except Exception:
        return False
# ===== Admin Panel View =====
@user_passes_test(is_admin_address)
def admin_panel_view(request):
    try:
        pending = get_all_pending_requests()
        return render(request, "admin_panel.html", {"pending_requests": pending})
    except Exception as e:
        messages.error(request, f"Error: {e}")
        return render(request, "admin_panel.html", {"pending_requests": []})
# ===== Wallet Connection =====
def connect_wallet_page(request):
    return render(request, "connect_wallet.html")

def wallet_login_view(request):
    if request.method == "POST":
        wallet_address = request.POST.get("wallet_address")

        if not wallet_address:
            messages.error(request, "Wallet address is required.")
            return redirect("connect_wallet")

        try:
            # Convert to checksum and ensure consistency
            wallet_address = Web3.to_checksum_address(wallet_address.strip().lower())
        except Exception:
            messages.error(request, "Invalid wallet address format.")
            return redirect("connect_wallet")

        # Create or get the user
        user, _ = WalletUser.objects.get_or_create(wallet_address=wallet_address.lower())
        # Register user in the contract if not already registered
        from dashboard.web3 import contract
        from dashboard.utils.utils import admin_register_user
        if not contract.functions.registered(wallet_address).call():
            admin_register_user(wallet_address)
        # Specify backend explicitly to avoid ValueError
        login(request, user, backend='user.backends.WalletAddressBackend')

        messages.success(request, f"Wallet {wallet_address[:6]}... connected!")
        return redirect("portfolio")

    return redirect("connect_wallet")
# ===== Portfolio View =====
# Fixed portfolio view transaction processing
@login_required
def portfolio_view(request):
    print("[portfolio_view] User:", request.user)
    user_wallet = Web3.to_checksum_address(request.user.wallet_address.lower())
    print("[portfolio_view] User wallet:", user_wallet)

    # Step 1: Get balances and watchlist
    try:
        usd_balance = get_virtual_balance(user_wallet)
        print("[portfolio_view] USD balance:", usd_balance)
    except Exception as e:
        print("[portfolio_view] Error fetching USD balance:", e)

    usd_balance_virtual = float(usd_balance)  if usd_balance else 0.0  # Convert cents to dollars
    try:
        watchlist = get_watchlist(user_wallet)
        print("[portfolio_view] Watchlist:", watchlist)
    except Exception as e:
        print("[portfolio_view] Error fetching watchlist:", e)

    try:
        transaction_data = get_transaction_history(user_wallet)
        print("[portfolio_view] Transaction data:", transaction_data)
    except Exception as e:
        print("[portfolio_view] Error fetching transaction history:", e)

    # Step 2: Filter transactions
    tx_type = request.GET.get("type")
    print("[portfolio_view] Transaction type filter:", tx_type)
    filtered_transactions = []
    for tx in transaction_data:
        if not isinstance(tx, (list, tuple)) or len(tx) < 4:
            continue
        if tx_type and tx[0] != tx_type:
            continue
        filtered_transactions.append({
            "timestamp": tx[3],
            "type": tx[0],
            "symbol": tx[1],
            "quantity": tx[2],
            "amount": tx[2],
            "usd_value": tx[2],
        })

    # Step 3: Get coin info
    try:
        markets_url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=False"
        market_data = cache.get('coingecko_market_data_top50')
        if not market_data:
            response = requests.get(markets_url, headers={'Accept': 'application/json'})
            market_data = response.json() if response.status_code == 200 else []
            cache.set('coingecko_market_data_top50', market_data, 120)
        print("[portfolio_view] Market data fetched:", market_data)
        coin_map = {}
        for coin in market_data:
            symbol = coin.get('symbol', '').upper()
            if symbol:
                coin_map[symbol] = {
                    'id': coin.get('id'),
                    'name': coin.get('name'),
                    'image': coin.get('image'),
                    'market_cap_rank': coin.get('market_cap_rank')
                }
        coingecko_list_url = "https://api.coingecko.com/api/v3/coins/list"
        all_coins = cache.get('coingecko_all_coins')
        if not all_coins:
            response = requests.get(coingecko_list_url, headers={'Accept': 'application/json'})
            all_coins = response.json() if response.status_code == 200 else []
            cache.set('coingecko_all_coins', all_coins, 600)
        for coin in all_coins:
            symbol = coin.get('symbol', '').upper()
            if symbol and symbol not in coin_map:
                coin_map[symbol] = {
                    'id': coin.get('id'),
                    'name': coin.get('name'),
                    'image': None
                }
        print("[portfolio_view] Coin map built:", coin_map)
    except Exception as e:
        print("[portfolio_view] Error fetching coin info:", e)
        coin_map = {
            'BTC': {'id': 'bitcoin', 'name': 'Bitcoin', 'image': 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png'},
            'ETH': {'id': 'ethereum', 'name': 'Ethereum', 'image': 'https://assets.coingecko.com/coins/images/279/large/ethereum.png'},
            'STETH': {'id': 'staked-ether', 'name': 'Staked ETH', 'image': 'https://assets.coingecko.com/coins/images/13442/large/steth_logo.png'},
            'BNB': {'id': 'binancecoin', 'name': 'BNB', 'image': 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png'},
            'USDT': {'id': 'tether', 'name': 'Tether', 'image': 'https://assets.coingecko.com/coins/images/325/large/Tether.png'},
            'SOL': {'id': 'solana', 'name': 'Solana', 'image': 'https://assets.coingecko.com/coins/images/4128/large/solana.png'},
            'ADA': {'id': 'cardano', 'name': 'Cardano', 'image': 'https://assets.coingecko.com/coins/images/975/large/cardano.png'},
            'XRP': {'id': 'ripple', 'name': 'XRP', 'image': 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png'},
            'DOGE': {'id': 'dogecoin', 'name': 'Dogecoin', 'image': 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png'},
            'DOT': {'id': 'polkadot', 'name': 'Polkadot', 'image': 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png'},
            'ENA': {'id': 'enjincoin', 'name': 'Enjin Coin', 'image': 'https://assets.coingecko.com/coins/images/110/large/enjincoin.png'},
            'MATIC': {'id': 'matic-network', 'name': 'Polygon', 'image': 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png'}
        }

    # Step 4: Build holdings
    holdings = []
    user_coins = set()
    for tx in transaction_data:
        if isinstance(tx, (list, tuple)) and len(tx) >= 2:
            user_coins.add(tx[1].upper())
    try:
        symbols, _ = contract.functions.getUserHoldings(user_wallet).call()
        user_coins.update([s.upper() for s in symbols])
    except Exception as e:
        print("[portfolio_view] Error building holdings:", e)
        pass
    for symbol in user_coins:
        try:
            coin_info = coin_map.get(symbol, {'id': symbol.lower(), 'name': symbol})
            balance = get_coin_balance(user_wallet, symbol)
            balance = float(balance) if balance else 0.0
            buy_price = get_avg_buy_price(user_wallet, symbol)
            live_price = get_live_price(symbol)
            try:
                live_price = float(live_price)
            except (TypeError, ValueError):
                live_price = 0.0
            image_url = coin_info.get('image')
            if not image_url:
                try:
                    url = f"https://api.coingecko.com/api/v3/coins/{coin_info['id']}"
                    headers = {'Accept': 'application/json'}
                    response = requests.get(url, headers=headers)
                    if response.status_code == 200:
                        data = response.json()
                        image_url = data.get('image', {}).get('large')
                    else:
                        image_url = None
                except Exception as e:
                    image_url = None
            if not image_url:
                image_url = f"https://assets.coingecko.com/coins/images/1/large/bitcoin.png"
            name = coin_info['name']
            if balance > 0 or live_price > 0:
                holdings.append({
                    "image": image_url,
                    "symbol": symbol,
                    "name": name,
                    "balance": balance,
                    "quantity": balance,
                    "buy_price": float(buy_price) if buy_price else 0.0,
                    "live_price": live_price,
                    "total_value": balance * live_price
                })
        except Exception as e:
            print("[portfolio_view] Error processing coin", symbol, e)
            pass
    filtered_holdings = [coin for coin in holdings if coin["quantity"] > 0]

    # Fetch borrowed amount
    try:
        borrowed = get_borrowed_amount(user_wallet)
        print("[portfolio_view] Borrowed amount:", borrowed)
    except Exception as e:
        print("[portfolio_view] Error fetching borrowed amount:", e)
        borrowed = 0.0

    context = {
        "wallet": user_wallet,
        "usd_balance_virtual": usd_balance_virtual,
        "usd_balance_raw": usd_balance,
        "watchlist": watchlist,
        "transactions": filtered_transactions,
        "holdings": holdings,
        "filtered_holdings": filtered_holdings,
        "borrowed": borrowed
    }
    print("[portfolio_view] Context:", context)
    return render(request, "portfolio.html", context)
# ===== Borrow USD =====
@login_required
def borrow_virtual_funds_view(request):
    if request.method == "POST":
        amount = int(request.POST.get("amount"))
        user_wallet = Web3.to_checksum_address(request.user.wallet_address.lower())
        
        from dashboard.utils.utils import admin_register_user, request_virtual_funds_for
        # Register user if not already registered
        if not contract.functions.registered(user_wallet).call():
            admin_register_user(user_wallet)
        try:
            tx_hash = request_virtual_funds_for(user_wallet, amount)
            messages.success(request, f"Borrowed ${amount}. TX: {tx_hash[:10]}...")
        except Exception as e:
            messages.error(request, f"Borrow failed: {e}")
    return redirect("portfolio")

# ===== Repay USD =====
@login_required
@login_required
def repay_virtual_funds_view(request):
    if request.method == "POST":
        amount = int(float(request.POST.get("amount")))
        try:
            user_wallet = Web3.to_checksum_address(request.user.wallet_address.lower())
            tx_hash = repay_virtual_funds(user_wallet, amount)
            # Wait for the transaction to be mined
            Web3.eth.wait_for_transaction_receipt(tx_hash)
            messages.success(request, f"Repaid ${amount}. TX: {tx_hash[:10]}...")
        except Exception as e:
            messages.error(request, f"Repayment failed: {e}")
    return redirect("portfolio")
# ===== Transaction History View =====
@login_required
def transaction_history_view(request):
    user_wallet = Web3.to_checksum_address(request.user.wallet_address.lower())
    if not user_wallet:
        messages.error(request, "Wallet address is required.")
        return render(request, "transaction_history.html", {})

    user_wallet = Web3.to_checksum_address(user_wallet.lower())
    try:
        transactions = get_transaction_history(user_wallet)
        # --- Fetch buy/sell events from logs ---
        buy_events = []
        sell_events = []
        DEPLOY_BLOCK = 8819605  # <-- Set this to your contract's actual deploy block
        # Fetch live prices for coins
        import requests
        coingecko_url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=False"
        try:
            response = requests.get(coingecko_url, headers={'Accept': 'application/json'})
            market_data = response.json() if response.status_code == 200 else []
            price_map = {coin['symbol'].upper(): float(coin['current_price']) for coin in market_data if 'symbol' in coin and 'current_price' in coin}
        except Exception as e:
            price_map = {}

        # CoinBought: user is indexed, so we can filter
        try:
            latest_block = web3.eth.block_number
            chunk_size = 500
            buy_logs_all = []
            for start in range(DEPLOY_BLOCK, latest_block + 1, chunk_size):
                end = min(start + chunk_size - 1, latest_block)
                try:
                    chunk_events = contract.events.CoinBought().get_logs(from_block=start, to_block=end, argument_filters={'user': user_wallet})
                    buy_logs_all.extend(chunk_events)
                except Exception as e:
                    pass
            for event in buy_logs_all:
                block = event['blockNumber']
                timestamp = int(web3.eth.get_block(block)['timestamp'])
                symbol = event['args']['symbol'].upper()
                amount = event['args']['quantity']
                usd_value = None
                if 'totalCost' in event['args']:
                    usd_value = float(event['args']['totalCost']) / 100
                elif 'pricePerToken' in event['args']:
                    usd_value = float(amount) * (float(event['args']['pricePerToken']) / 100)
                else:
                    usd_value = float(amount)  # fallback
                buy_events.append({
                    'type': 'buy',
                    'symbol': symbol,
                    'amount': amount,
                    'timestamp': timestamp,
                    'usd_value': usd_value,
                    'tx_hash': event['transactionHash'].hex(),
                })
        except Exception as e:
            pass

        # CoinSold: user is NOT indexed, so we CANNOT filter in the query
        # Paginate to avoid provider limits
        try:
            latest_block = web3.eth.block_number
            chunk_size = 500
            sell_logs_all = []
            for start in range(DEPLOY_BLOCK, latest_block + 1, chunk_size):
                end = min(start + chunk_size - 1, latest_block)
                try:
                    chunk_events = contract.events.CoinSold().get_logs(from_block=start, to_block=end)
                    sell_logs_all.extend(chunk_events)
                except Exception as e:
                    pass
            # Filter in Python
            for event in sell_logs_all:
                if event['args'].get('user', '').lower() != user_wallet.lower():
                    continue
                block = event['blockNumber']
                timestamp = int(web3.eth.get_block(block)['timestamp'])
                symbol = event['args']['symbol'].upper()
                amount = event['args']['quantity']
                usd_value = None
                if 'totalCost' in event['args']:
                    usd_value = float(event['args']['totalCost']) / 100
                elif 'pricePerToken' in event['args']:
                    usd_value = float(amount) * (float(event['args']['pricePerToken']) / 100)
                else:
                    usd_value = float(amount)  # fallback
                sell_events.append({
                    'type': 'sell',
                    'symbol': symbol,
                    'amount': amount,
                    'timestamp': timestamp,
                    'usd_value': usd_value,
                    'tx_hash': event['transactionHash'].hex(),
                })
        except Exception as e:
            pass

        # --- Convert contract history to dicts ---

        contract_txs = []
        for tx in transactions:
            contract_txs.append({
                'type': tx[0],
                'symbol': tx[1],
                'quantity': tx[2],
                'timestamp': tx[3],
                'buy_price': None,  # Not available for contract-only txs
                'usd_value': tx[2],
                'tx_hash': '',
            })

        # Add buy_price and correct usd_value for buy/sell events
        def get_event_buy_price(symbol, tx_hash):
            # Find the buy event with this tx_hash and symbol
            for event in buy_events:
                if event['symbol'] == symbol and event['tx_hash'] == tx_hash:
                    if event['amount'] and event['usd_value']:
                        return float(event['usd_value']) / float(event['amount'])
            return None

        # Update buy_events and sell_events with buy_price and correct usd_value
        for event in buy_events:
            event['quantity'] = event.pop('amount')
            if event['quantity'] and event['usd_value']:
                event['buy_price'] = float(event['usd_value']) / float(event['quantity'])
                event['usd_value'] = float(event['quantity']) * event['buy_price']
            else:
                event['buy_price'] = None
        for event in sell_events:
            event['quantity'] = event.pop('amount')
            # For sell, use the latest buy price for that symbol
            buy_price = None
            # Find the most recent buy event for this symbol before this sell
            relevant_buys = [e for e in buy_events if e['symbol'] == event['symbol'] and e['timestamp'] <= event['timestamp']]
            if relevant_buys:
                buy_price = relevant_buys[-1]['buy_price']
            event['buy_price'] = buy_price
            if buy_price is not None:
                event['usd_value'] = float(event['quantity']) * buy_price
            # else leave as is

        all_txs = contract_txs + buy_events + sell_events
        all_txs.sort(key=lambda x: x['timestamp'], reverse=True)

        tx_type = request.GET.get("type")
        start_date = request.GET.get("start_date")
        end_date = request.GET.get("end_date")

        from datetime import datetime
        filtered = []
        for tx_dict in all_txs:
            # Convert timestamp to datetime object if it's an int or float
            ts = tx_dict.get("timestamp")
            if isinstance(ts, (int, float)):
                try:
                    tx_dict["timestamp"] = datetime.fromtimestamp(ts)
                except Exception as e:
                    tx_dict["timestamp"] = None
            # Filter by type
            if tx_type and tx_dict["type"] != tx_type:
                continue
            # Filter by start_date
            if start_date and tx_dict["timestamp"]:
                try:
                    start_dt = datetime.fromisoformat(start_date)
                    if tx_dict["timestamp"] < start_dt:
                        continue
                except Exception as e:
                    pass
            # Filter by end_date
            if end_date and tx_dict["timestamp"]:
                try:
                    end_dt = datetime.fromisoformat(end_date)
                    if tx_dict["timestamp"] > end_dt:
                        continue
                except Exception as e:
                    pass
            filtered.append(tx_dict)

        return render(request, "transaction_history.html", {
            "transactions": filtered,
            "wallet": user_wallet,
        })

    except Exception as e:
        messages.error(request, f"Error fetching transactions: {e}")
        return render(request, "transaction_history.html", {})
    
# ===== Approve / Reject Borrow Requests =====
@login_required
def approve_request_view(request, user_wallet):
    try:
        user_wallet = Web3.to_checksum_address(user_wallet)
        tx_hash = approve_virtual_funds(user_wallet)
        messages.success(request, f"Approved request for {user_wallet}. TX: {tx_hash}")
    except Exception as e:
        messages.error(request, f"Approve failed: {e}")
    return redirect('admin_panel')

@login_required
def reject_request_view(request, user_wallet):
    try:
        user_wallet = Web3.to_checksum_address(user_wallet)
        tx_hash = reject_virtual_funds(user_wallet)
        messages.success(request, f"Rejected request for {user_wallet}. TX: {tx_hash}")
    except Exception as e:
        messages.error(request, f"Reject failed: {e}")
    return redirect('admin_panel')

# Remove the local get_live_price function since we're now using the one from utils.py

# ===== Logout =====
def logout_view(request):
    if not request.user.is_superuser:
        logout(request)
        messages.success(request, "Wallet user logged out.")
    else:
        messages.info(request, "Admin session preserved.")
    return redirect("connect_wallet")

def admin_login_view(request):
    if request.user.is_authenticated and request.user.is_superuser:
        return redirect('admin_panel')  # Redirect if already logged in as admin

    if request.method == "POST":
        wallet_address = request.POST.get("wallet_address")
        password = request.POST.get("password")

        if not wallet_address or not password:
            messages.error(request, "Both wallet address and password are required.")
            return redirect("admin_login")

        user = authenticate(request, wallet_address=wallet_address, password=password)

        if user is not None and user.is_superuser:
            login(request, user)
            messages.success(request, "Admin logged in successfully.")
            return redirect("admin_panel")
        else:
            messages.error(request, "Invalid credentials or not authorized.")
            return redirect("admin_login")

    return render(request, "admin_login.html")
