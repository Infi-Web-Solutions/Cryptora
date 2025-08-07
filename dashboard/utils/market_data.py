import requests
from datetime import datetime, timedelta

def get_coingecko_market_data():
    try:
        url = 'https://api.coingecko.com/api/v3/global'
        response = requests.get(url)
        if response.status_code == 200:
            json_data = response.json()
            data = json_data.get('data', {})
            result = {
                'total_market_cap': data.get('total_market_cap', {}).get('usd', 0),
                'total_volume': data.get('total_volume', {}).get('usd', 0),
                'market_cap_change_percentage_24h': data.get('market_cap_change_percentage_24h', 0.0),
                'market_cap_percentage': data.get('market_cap_percentage', {'btc': 0, 'eth': 0}),
                'active_cryptocurrencies': data.get('active_cryptocurrencies', 0),
                'markets': data.get('markets', 0),
                'last_updated': data.get('updated_at', '')
            }
            return result
        else:
            print(f"[ERROR] CoinGecko global API failed with status {response.status_code}")
    except Exception as e:
        print(f"[EXCEPTION] Error fetching CoinGecko global data: {str(e)}")
    return None

def get_historical_market_data(symbol, days=7):
    try:
        # Convert days to milliseconds
        end_time = int(datetime.now().timestamp() * 1000)
        start_time = end_time - (int(days) * 24 * 60 * 60 * 1000)

        # Determine interval based on time range
        if int(days) <= 1:
            interval = '1m'  # 1 minute
        elif int(days) <= 7:
            interval = '15m'  # 15 minutes
        elif int(days) <= 30:
            interval = '1h'  # 1 hour
        elif int(days) <= 90:
            interval = '4h'  # 4 hours
        else:
            interval = '1d'  # 1 day

        # Format symbol for Binance (add USDT pair)
        binance_symbol = f"{symbol.upper()}USDT"

        # Fetch kline (candlestick) data from Binance
        url = 'https://api.binance.com/api/v3/klines'
        params = {
            'symbol': binance_symbol,
            'interval': interval,
            'startTime': start_time,
            'endTime': end_time,
            'limit': 1000  # Maximum limit for most intervals
        }
        response = requests.get(url, params=params)
        
        if response.status_code == 200:
            klines = response.json()

            # Format data for chart
            try:
                # Use closing price (index 4) for price data
                prices = [[int(k[0]), float(k[4])] for k in klines]
                # Use volume (index 5) for volume data
                volumes = [[int(k[0]), float(k[5])] for k in klines]
                market_caps = []  # Binance doesn't provide market cap data
            except Exception as e:
                return None

            return {
                'prices': prices,
                'volumes': volumes,
                'market_caps': market_caps
            }
            # Get top coins data for the period
            coins_url = "https://api.coingecko.com/api/v3/coins/markets"
            coins_params = {
                "vs_currency": "usd",
                "order": "market_cap_desc",
                "per_page": 10,
                "sparkline": True,
                "days": str(days)
            }
            coins_response = requests.get(coins_url, params=coins_params)
            top_coins = []
            if coins_response.status_code == 200:
                try:
                    coins_data = coins_response.json()
                    top_coins = coins_data if isinstance(coins_data, list) else []
                except Exception as e:
                    top_coins = []
            result = {
                'market_caps': market_caps,
                'volumes': volumes,
                'top_coins': top_coins
            }
            return result
        else:
            print(f"[ERROR] CoinGecko historical API failed with status {response.status_code}")
    except Exception as e:
        print(f"[EXCEPTION] Error fetching historical market data: {str(e)}")
    return None
