from django.urls import path
from .views import ( 
                    dashboard_view,
                    coin_detail_view,
                    # add_coin_to_watchlist_view, 
                    # remove_coin_from_watchlist_view,
                    buy_coin_view,
                    sell_coin_view,
                    market_chart_view,
                    get_market_data,
                    get_market_history,
                    other_coins_view,
                )

urlpatterns = [
    path("market-overview/", market_chart_view, name="market_overview"),
    path("dashboard/", dashboard_view, name="dashboard"),
    path('coin/<str:symbol>/', coin_detail_view, name='coin_detail'),
    # path('watchlist/add/<str:symbol>/', add_coin_to_watchlist_view, name='add_watchlist'),
    # path('watchlist/remove/<str:symbol>/',remove_coin_from_watchlist_view, name='remove_watchlist'),
    path("buy/", buy_coin_view, name="buy_coin"),
    path("api/market-data/", get_market_data, name="market_data"),
    path("api/market-history/<str:symbol>/", get_market_history, name="market_history"),
    path("sell/", sell_coin_view, name="sell_coin"),
    path('other-coins/', other_coins_view, name='other_coins'),
]
