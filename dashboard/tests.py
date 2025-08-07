from django.test import TestCase
from django.urls import reverse
from unittest.mock import patch
from django.contrib.auth import get_user_model
from dashboard.utils.utils import (
    get_live_price, buy_coin, sell_coin, request_virtual_funds, repay_virtual_funds
)
from web3 import Web3

User = get_user_model()

class DashboardTests(TestCase):

    def test_get_live_price(self):
        symbol = "BTC"
        price = get_live_price(symbol)
        print(f"[DEBUG] test_get_live_price: {symbol} price = {price}")
        self.assertIsInstance(price, float)
        self.assertGreater(price, 0, "Price should be greater than 0")

    @patch("dashboard.utils.utils.web3.eth.send_raw_transaction")
    def test_buy_coin(self, mock_send_raw_transaction):
        tx_bytes = bytes.fromhex("ab" * 32)
        mock_send_raw_transaction.return_value = tx_bytes

        user_wallet = Web3.to_checksum_address("0x16d3ACbD38aa841DB2Da166041e99C9d3cb98750")
        symbol = "ETH"
        price = 2000  # in cents
        quantity = 1

        tx_hash = buy_coin(user_wallet, symbol, price, quantity)
        print(f"[DEBUG] test_buy_coin: tx_hash = {tx_hash}")
        self.assertEqual(tx_hash, Web3.to_hex(tx_bytes))

    @patch("dashboard.utils.utils.web3.eth.send_raw_transaction")
    def test_sell_coin(self, mock_send_raw_transaction):
        tx_bytes = bytes.fromhex("cd" * 32)
        mock_send_raw_transaction.return_value = tx_bytes

        user_wallet = Web3.to_checksum_address("0x16d3ACbD38aa841DB2Da166041e99C9d3cb98750")
        symbol = "ETH"
        price = 2000  # in cents
        quantity = 1

        tx_hash = sell_coin(user_wallet, symbol, price, quantity)
        print(f"[DEBUG] test_sell_coin: tx_hash = {tx_hash}")
        self.assertEqual(tx_hash, Web3.to_hex(tx_bytes))

    @patch("dashboard.utils.utils.web3.eth.send_raw_transaction")
    def test_request_virtual_funds(self, mock_send_raw_transaction):
        tx_bytes = bytes.fromhex("de" * 32)
        mock_send_raw_transaction.return_value = tx_bytes

        amount = 1000  # in cents
        tx_hash = request_virtual_funds(amount)
        print(f"[DEBUG] test_request_virtual_funds: tx_hash = {tx_hash}")
        self.assertEqual(tx_hash, Web3.to_hex(tx_bytes))

    @patch("dashboard.utils.utils.web3.eth.send_raw_transaction")
    def test_repay_virtual_funds(self, mock_send_raw_transaction):
        tx_bytes = bytes.fromhex("ef" * 32)
        mock_send_raw_transaction.return_value = tx_bytes

        user_wallet = Web3.to_checksum_address("0x16d3ACbD38aa841DB2Da166041e99C9d3cb98750")
        amount = 1000  # in cents
        tx_hash = repay_virtual_funds(user_wallet, amount)
        print(f"[DEBUG] test_repay_virtual_funds: tx_hash = {tx_hash}")
        self.assertEqual(tx_hash, Web3.to_hex(tx_bytes))

    def test_dashboard_view(self):
        user = User.objects.create_user(
            wallet_address="0x16d3ACbD38aa841DB2Da166041e99C9d3cb98750",
            password="testpassword",
        )
        self.client.login(wallet_address="0x16d3ACbD38aa841DB2Da166041e99C9d3cb98750", password="testpassword")
        response = self.client.get(reverse("dashboard"), follow=True)
        print(f"[DEBUG] test_dashboard_view: response.status_code = {response.status_code}")
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "dashboard.html")
