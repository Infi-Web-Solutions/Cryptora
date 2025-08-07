import json
import traceback
from django.http import Http404, HttpResponseBadRequest, JsonResponse
import requests
from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from web3 import Web3
from .utils.market_data import get_coingecko_market_data, get_historical_market_data
from dashboard.web3 import contract, web3  # Import web3 from web3.py
from dashboard.utils.utils import (
    repay_virtual_funds,
    request_virtual_funds,
    get_virtual_balance,
    buy_coin,
    sell_coin,
    get_transaction_history,
    get_coin_balance,
    get_live_price,
)

# ===================== BUY COIN =====================

def buy_coin_view(request):
    if request.method == "POST":
        symbol = request.POST.get("symbol")
        price = request.POST.get("price")
        quantity = request.POST.get("quantity")

        if not symbol or not price or not quantity:
            return HttpResponseBadRequest("Missing data.")

        try:
            total_cost = float(price) * float(quantity)
            user_wallet = request.user.wallet_address if hasattr(request.user, 'wallet_address') else request.GET.get('wallet')
            if not user_wallet:
                messages.error(request, "Wallet not found. Please log in.")
                return redirect("dashboard")
            virtual_balance = get_virtual_balance(user_wallet)
            if float(virtual_balance) < total_cost * 100:
                messages.error(request, f"Insufficient virtual USD balance. You need ${total_cost:.2f} but have ${float(virtual_balance)/100:.2f}.")
                return redirect("dashboard")
            price_cents = int(float(price) * 100)
            tx_hash = buy_coin(user_wallet, symbol, price_cents, int(quantity))
            messages.success(request, f"Buy TX sent! Hash: {tx_hash}")
        except Exception as e:
            messages.error(request, f"Buy failed: {str(e)}")

    return redirect("dashboard")

# ===================== SELL COIN =====================
def sell_coin_view(request):
    if request.method == "POST":
        symbol = request.POST.get("symbol")
        price = request.POST.get("price")
        quantity = request.POST.get("quantity")

        if not symbol or not price or not quantity:
            return HttpResponseBadRequest("Missing data.")

        try:
            user_wallet = request.user.wallet_address if hasattr(request.user, 'wallet_address') else request.GET.get('wallet')
            if not user_wallet:
                messages.error(request, "Wallet not found. Please log in.")
                return redirect("dashboard")

            # Check user's holdings for the coin
            from user.models import WalletUser
            from dashboard.utils.utils import get_coin_balance
            user_balance = get_coin_balance(user_wallet, symbol)
            if not user_balance or float(user_balance) < float(quantity):
                messages.error(request, f"Insufficient {symbol} balance. You have {user_balance}, tried to sell {quantity}.")
                return redirect("dashboard")

            price_cents = int(float(price) * 100)
            tx_hash = sell_coin(user_wallet, symbol, price_cents, int(quantity))
            messages.success(request, f"Sell TX sent! Hash: {tx_hash}")
        except Exception as e:
            messages.error(request, f"Sell failed: {str(e)}")

    return redirect("dashboard")

# ===================== REQUEST FUNDS =====================

def request_funds_view(request):
    if request.method == 'POST':
        amount = request.POST.get('amount')
        try:
            tx_hash = request_virtual_funds(int(amount))
            messages.success(request, f"Requested: {amount} USD | Tx: {tx_hash}")
        except Exception as e:
            messages.error(request, f"Request failed: {str(e)}")
    return redirect('dashboard')

# ===================== REPAY FUNDS =====================
def repay_funds_view(request):
    if request.method == "POST":
        amount = request.POST.get("amount")
        try:
            tx_hash = repay_virtual_funds(int(amount))
            messages.success(request, f"Repaid {amount} USD | Tx: {tx_hash}")
        except Exception as e:
            messages.error(request, f"Repayment failed: {str(e)}")
    return redirect('dashboard')

# ===================== MARKET DATA ENDPOINTS =====================
def get_market_data(request):
    market_data = get_coingecko_market_data()
    if market_data:
        return JsonResponse(market_data)
    return JsonResponse({'error': 'Failed to fetch market data'}, status=500)

def get_market_history(request, symbol):
    try:
        days = int(request.GET.get('days', 7))
        if days <= 0:
            return JsonResponse({'error': 'Days parameter must be positive'}, status=400)
            
        # Get historical data for specific coin
        data = get_historical_market_data(symbol, days)
        if not data:
            return JsonResponse({'error': 'No data available'}, status=404)
            
        return JsonResponse({
            'prices': data.get('prices', []),
            'market_caps': data.get('market_caps', []),
            'volumes': data.get('volumes', [])
        })
        
    except ValueError as e:
        return JsonResponse({'error': f'Invalid days parameter: {str(e)}'}, status=400)
    except Exception as e:
        return JsonResponse({'error': 'Failed to fetch historical data', 'detail': str(e)}, status=500)

def repay_funds_view(request):
    if request.method == "POST":
        amount = request.POST.get("amount")
        try:
            tx_hash = repay_virtual_funds(int(amount))
            messages.success(request, f"Repaid {amount} USD | Tx: {tx_hash}")
        except Exception as e:
            messages.error(request, f"Repayment failed: {str(e)}")
        return redirect('dashboard')

# ===================== BALANCE VIEW =====================
def virtual_balance_view(request):
    wallet = request.GET.get('wallet')
    try:
        balance = get_virtual_balance(wallet)
    except Exception as e:
        messages.error(request, "Could not fetch balance.")
        balance = 0
    return render(request, 'balance.html', {'balance': balance})

# ===================== WATCHLIST =====================
# @login_required
# def add_coin_to_watchlist_view(request, symbol):
#     # Add/remove watchlist logic must be done on the frontend using MetaMask.
#     # This backend view only displays the current watchlist for the user.
#     user_wallet = Web3.to_checksum_address(request.user.wallet_address.lower())
#     print(f"[DEBUG][add_coin_to_watchlist_view] Displaying watchlist for user_wallet: {user_wallet}")
#     try:
#         watchlist = get_watchlist(user_wallet)
#         print(f"[DEBUG][add_coin_to_watchlist_view] Watchlist: {watchlist}")
#         messages.info(request, f"Your current watchlist: {', '.join(watchlist) if watchlist else 'Empty'}")
#     except Exception as e:
#         print(f"[DEBUG][add_coin_to_watchlist_view] Error fetching watchlist: {e}")
#         messages.error(request, f"Could not fetch watchlist: {e}")
#     return redirect("portfolio")

# def remove_coin_from_watchlist_view(request, symbol):
#     # Add/remove watchlist logic must be done on the frontend using MetaMask.
#     # This backend view only displays the current watchlist for the user.
#     user_wallet = Web3.to_checksum_address(request.user.wallet_address.lower())
#     print(f"[DEBUG][remove_coin_from_watchlist_view] Displaying watchlist for user_wallet: {user_wallet}")
#     try:
#         watchlist = get_watchlist(user_wallet)
#         print(f"[DEBUG][remove_coin_from_watchlist_view] Watchlist: {watchlist}")
#         messages.info(request, f"Your current watchlist: {', '.join(watchlist) if watchlist else 'Empty'}")
#     except Exception as e:
#         print(f"[DEBUG][remove_coin_from_watchlist_view] Error fetching watchlist: {e}")
#         messages.error(request, f"Could not fetch watchlist: {e}")
#     return redirect("portfolio")


# ===================== TRANSACTION HISTORY =====================
def transaction_history_view(request):
    wallet = request.GET.get("wallet")
    try:
        history = get_transaction_history(wallet)
    except Exception as e:
        messages.error(request, "Could not load transactions.")
        history = []
    return render(request, "transaction_history.html", {"transactions": history})

# ===================== DASHBOARD =====================
@login_required
def dashboard_view(request):
    try:
        user_wallet = Web3.to_checksum_address(request.user.wallet_address.lower())

        # Fetch virtual balance
        virtual_balance = get_virtual_balance(user_wallet)  # Convert cents to dollars
        # Get raw transactions
        transactions = get_transaction_history(user_wallet)
        # --- Fetch buy/sell events from logs ---
        buy_events = []
        sell_events = []
        DEPLOY_BLOCK = 8824481

        # Fetch CoinBought events
        try:
            latest_block = web3.eth.block_number
            chunk_size = 500
            buy_logs_all = []
            
            for start in range(DEPLOY_BLOCK, latest_block + 1, chunk_size):
                end = min(start + chunk_size - 1, latest_block)
                try:
                    chunk_events = contract.events.CoinBought().get_logs(
                        from_block=start, 
                        to_block=end, 
                        argument_filters={'user': user_wallet}
                    )
                    buy_logs_all.extend(chunk_events)
                except Exception as e:
                    pass # Removed print(f"[DEBUG] Error fetching CoinBought logs for blocks {start}-{end}: {e}")

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
                    usd_value = float(amount)

                buy_events.append({
                    'type': 'buy',
                    'symbol': symbol,
                    'amount': amount,
                    'timestamp': timestamp,
                    'usd_value': usd_value,
                    'tx_hash': event['transactionHash'].hex(),
                })
        except Exception as e:
            pass # Removed print(f"[DEBUG] Error fetching CoinBought logs: {e}")

        # Convert contract history to dicts
        contract_txs = []
        for tx in transactions:
            contract_txs.append({
                'type': tx[0],
                'symbol': tx[1],
                'quantity': tx[2],
                'timestamp': tx[3],
                'buy_price': None,
                'usd_value': tx[2],
                'tx_hash': '',
            })

        # Update buy_events with buy_price and correct usd_value
        for event in buy_events:
            event['quantity'] = event.pop('amount')
            if event['quantity'] and event['usd_value']:
                event['buy_price'] = float(event['usd_value']) / float(event['quantity'])
                event['usd_value'] = float(event['quantity']) * event['buy_price']
            else:
                event['buy_price'] = None

        # Combine all transactions
        all_txs = contract_txs + buy_events + sell_events
        all_txs.sort(key=lambda x: x['timestamp'], reverse=True)

        # Calculate total buy cost
        total_buy_cost = 0
        for tx in all_txs:
            if tx['type'] == 'buy':
                total_buy_cost += float(tx['usd_value'])

        # Calculate current holdings value
        total_holdings_value = 0
        user_coins = set(tx['symbol'] for tx in all_txs if tx['type'] == 'buy')
        
        for symbol in user_coins:
            try:
                balance = get_coin_balance(user_wallet, symbol)
                balance = float(balance) if balance else 0.0
                live_price = get_live_price(symbol)
                try:
                    live_price = float(live_price)
                except (TypeError, ValueError):
                    live_price = 0.0

                if balance > 0 and live_price > 0:
                    coin_value = balance * live_price
                    total_holdings_value += coin_value

            except Exception as e:
                pass # Removed print(f"[DEBUG] Error calculating holdings value for {symbol}: {e}")

        # Calculate profit: current holdings value - total buy cost
        total_profit = total_holdings_value - total_buy_cost

        return render(request, "dashboard.html", {
            "total_balance": virtual_balance,
            "total_income": total_profit,
            "total_expense": total_holdings_value,
        })

    except Exception as e:
        return render(request, "dashboard.html", {
            "total_balance": 0,
            "total_income": 0,
            "total_expense": 0,
            "error": "Unable to fetch data",
        })

# ===================== COIN DETAIL =====================
def coin_detail_view(request, symbol):
    try:
        if not symbol:
            raise Http404("Invalid symbol")
        symbol = symbol.upper()
        binance_symbol = f"{symbol}USDT"

        # --- Get CoinGecko Data ---
        coin_info = {}
        coin_id = None
        try:
            search_url = f"https://api.coingecko.com/api/v3/search?query={symbol}"
            search_response = requests.get(search_url)
            if search_response.status_code == 200:
                search_data = search_response.json()
                if search_data.get('coins'):
                    for coin in search_data['coins']:
                        if coin['symbol'].upper() == symbol:
                            coin_id = coin['id']
                            break
            if coin_id:
                coingecko_url = f"https://api.coingecko.com/api/v3/coins/markets"
                params = {
                    "vs_currency": "usd",
                    "ids": coin_id,
                    "sparkline": False,
                }
                coingecko_response = requests.get(coingecko_url, params=params)
                if coingecko_response.status_code == 200:
                    coin_data = coingecko_response.json()
                    if coin_data:
                        coin_info = coin_data[0]
        except Exception as e:
            pass # Removed print("[CoinGecko] Error:", e)

        # --- Get Binance Data ---
        try:
            ticker_url = f"https://api.binance.com/api/v3/ticker/24hr?symbol={binance_symbol}"
            ticker_response = requests.get(ticker_url)
            if ticker_response.status_code != 200:
                raise Http404("Coin not found on Binance")
            ticker_data = ticker_response.json()
        except Exception as e:
            pass # Removed print("[Binance] Error:", e)
            raise Http404("Coin not found or API error.")

        # --- Recent Trades ---
        try:
            trades_url = f"https://api.binance.com/api/v3/trades?symbol={binance_symbol}&limit=50"
            trades_response = requests.get(trades_url)
            recent_trades = trades_response.json() if trades_response.status_code == 200 else []
        except Exception as e:
            pass # Removed print("[Trades] Error:", e)
            recent_trades = []

        # --- Order Book ---
        try:
            depth_url = f"https://api.binance.com/api/v3/depth?symbol={binance_symbol}&limit=10"
            depth_response = requests.get(depth_url)
            order_book = depth_response.json() if depth_response.status_code == 200 else {"bids": [], "asks": []}
        except Exception as e:
            pass # Removed print("[OrderBook] Error:", e)
            order_book = {"bids": [], "asks": []}

        # --- Market Cap ---
        market_cap = coin_info.get('market_cap', 0)
        try:
            market_cap = float(market_cap)
        except (TypeError, ValueError):
            market_cap = 0
        if market_cap >= 1000000000:
            market_cap_display = f"${market_cap/1000000000:.1f}B"
        elif market_cap >= 1000000:
            market_cap_display = f"${market_cap/1000000:.1f}M"
        elif market_cap > 0:
            market_cap_display = f"${int(market_cap):,}"
        else:
            market_cap_display = "N/A"

        # --- Context ---
        try:
            context = {
                "name": coin_info.get('name', symbol),
                "symbol": symbol,
                "image": coin_info.get('image', f'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/{symbol.lower()}.png'),
                "current_price": float(ticker_data['lastPrice']),
                "price_change_24h": float(ticker_data['priceChangePercent']),
                "market_cap": market_cap,
                "market_cap_display": market_cap_display,
                "market_cap_rank": coin_info.get('market_cap_rank', None),
                "total_volume": coin_info.get('total_volume', float(ticker_data.get('quoteVolume', 0))),
                "high_24h": float(ticker_data.get('highPrice', 0)),
                "low_24h": float(ticker_data.get('lowPrice', 0)),
                "volume_24h": float(ticker_data.get('volume', 0)),
                "quote_volume": float(ticker_data.get('quoteVolume', 0)),
                "weighted_avg_price": float(ticker_data.get('weightedAvgPrice', 0)),
                "open_price": float(ticker_data.get('openPrice', 0)),
                "close_price": float(ticker_data.get('lastPrice', 0)),
                "number_of_trades": int(ticker_data.get('count', 0)),
                "price_change": float(ticker_data.get('priceChange', 0)),
                "bid_price": float(ticker_data.get('bidPrice', 0)),
                "ask_price": float(ticker_data.get('askPrice', 0)),
                "recent_trades": recent_trades[:10],
                "order_book": {
                    "bids": order_book["bids"][:5],
                    "asks": order_book["asks"][:5]
                },
                # Additional CoinGecko data
                "ath": coin_info.get('ath'),
                "ath_change_percentage": coin_info.get('ath_change_percentage'),
                "ath_date": coin_info.get('ath_date'),
                "atl": coin_info.get('atl'),
                "atl_change_percentage": coin_info.get('atl_change_percentage'),
                "atl_date": coin_info.get('atl_date'),
                "roi": coin_info.get('roi'),
                "circulating_supply": coin_info.get('circulating_supply'),
                "total_supply": coin_info.get('total_supply'),
                "max_supply": coin_info.get('max_supply'),
                "fully_diluted_valuation": coin_info.get('fully_diluted_valuation'),
            }
        except Exception as e:
            pass # Removed print("[Context] Error:", e)
            raise Http404("Coin data error.")
        return render(request, "coin_detail.html", context)
    except Exception as e:
        raise Http404("Coin not found or API error.")

# ===================== GLOBAL MARKET STATS =====================
def market_chart_view(request):
    try:
        market_data = {}

        # Global market data
        global_url = "https://api.coingecko.com/api/v3/global"
        global_response = requests.get(global_url)
        if global_response.status_code == 200:
            global_json = global_response.json()
            global_data = global_json.get('data', {})
            market_data.update({
                "total_market_cap": global_data.get('total_market_cap', {}).get('usd'),
                "total_volume": global_data.get('total_volume', {}).get('usd'),
                "active_cryptocurrencies": global_data.get('active_cryptocurrencies'),
                "markets": global_data.get('markets'),
                "btc_dominance": global_data.get('market_cap_percentage', {}).get('btc'),
                "eth_dominance": global_data.get('market_cap_percentage', {}).get('eth')
            })
        else:
            print("[ERROR] Global market data failed with status", global_response.status_code)

        # Market chart data (last 30 days)
        chart_url = "https://api.coingecko.com/api/v3/global/market_cap_chart"
        chart_params = {
            "vs_currency": "usd",
            "days": 30
        }
        chart_response = requests.get(chart_url, params=chart_params)
        if chart_response.status_code == 200:
            chart_json = chart_response.json()
            market_data["chart_data"] = {
                "market_caps": chart_json.get("market_caps", []),
                "total_volumes": chart_json.get("total_volumes", [])
            }
        else:
            print("[ERROR] Chart data failed with status", chart_response.status_code, chart_response.text)

        return JsonResponse(market_data)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({
            "error": "Failed to fetch market data",
            "detail": str(e)
        }, status=500)

def coin_details_view(request, symbol):
    try:
        # Normalize the symbol to lowercase to match API expectations
        normalized_symbol = symbol.lower()
        # Fetch coin details from CoinGecko API
        url = f"https://api.coingecko.com/api/v3/coins/{normalized_symbol}"
        response = requests.get(url)
        if response.status_code == 200:
            coin_data = response.json()
            return render(request, 'coin_detail.html', {'coin': coin_data})
        else:
            return render(request, 'coin_detail.html', {'error': 'Coin not found'})
    except Exception as e:
        return render(request, 'coin_detail.html', {'error': str(e)})

def other_coins_view(request):
    return render(request, 'othercoins.html')
