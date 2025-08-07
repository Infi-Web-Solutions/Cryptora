from django.http import JsonResponse
from dashboard.utils.market_data import get_historical_market_data


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
        print(f"Error in get_market_history: {str(e)}")
        return JsonResponse({'error': 'Failed to fetch historical data', 'detail': str(e)}, status=500)
