from django.contrib.auth.backends import ModelBackend
from .models import WalletUser

class WalletAddressBackend(ModelBackend):
    def authenticate(self, request, wallet_address=None, password=None, **kwargs):
        if wallet_address is None or password is None:
            return None
        try:
            user = WalletUser.objects.get(wallet_address=wallet_address.lower())
            if user.check_password(password):
                return user
        except WalletUser.DoesNotExist:
            return None
        return None
