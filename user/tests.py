from django.contrib.auth import get_user_model
from django.test import TestCase

User = get_user_model()

class WalletUserTests(TestCase):

    def test_create_wallet_user(self):
        wallet_address = "add_your_wallet_address"
        user = User.objects.create_user(wallet_address=wallet_address)
        self.assertEqual(user.wallet_address, wallet_address.lower())
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)

    def test_wallet_user_authentication(self):
        wallet_address = "add_your_wallet_address"
        password = "testpassword"
        user = User.objects.create_user(wallet_address=wallet_address, password=password)
        authenticated_user = self.client.login(wallet_address=wallet_address, password=password)
        self.assertTrue(authenticated_user)

    def test_wallet_user_str_representation(self):
        wallet_address = "add_your_wallet_address"
        user = User.objects.create_user(wallet_address=wallet_address)
        self.assertEqual(str(user), wallet_address.lower())
