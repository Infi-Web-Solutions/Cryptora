from django.urls import path
from . import views

urlpatterns = [
    path('connect-wallet/', views.connect_wallet_page, name='connect_wallet'),
    path('wallet-login/', views.wallet_login_view, name='wallet_login'),
    path('portfolio/', views.portfolio_view, name='portfolio'),
    path("transactions/",views.transaction_history_view, name="transaction_history"),
    path("borrow-usd/", views.borrow_virtual_funds_view, name="borrow_virtual_funds"),
    path("repay-usd/", views.repay_virtual_funds_view, name="repay_virtual_funds"),
    path("admin-login/", views.admin_login_view, name="admin_login"),
    path("admins/borrow-requests/", views.admin_panel_view, name="admin_panel"),
    path("admins/approve/<str:user_wallet>/", views.approve_request_view, name="approve_borrow"),
    path("admins/reject/<str:user_wallet>/", views.reject_request_view, name="reject_borrow"),
    path("logout/", views.logout_view, name="logout"),
]
