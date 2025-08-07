from django.utils import timezone
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models

class WalletUserManager(BaseUserManager):
    def create_user(self, wallet_address, password=None, **extra_fields):
        if not wallet_address:
            raise ValueError("Wallet address is required")

        wallet_address = wallet_address.lower()
        user = self.model(wallet_address=wallet_address, **extra_fields)

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()  # For wallet-only login

        user.save(using=self._db)
        return user

    def create_superuser(self, wallet_address, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if not password:
            raise ValueError("Superusers must have a password.")

        return self.create_user(wallet_address, password, **extra_fields)

class WalletUser(AbstractBaseUser, PermissionsMixin):
    wallet_address = models.CharField(max_length=42, unique=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)  # ✅ Only use this

    objects = WalletUserManager()

    USERNAME_FIELD = "wallet_address"

    def __str__(self):
        return self.wallet_address

    def has_perm(self, perm, obj=None):
        return self.is_superuser

    def has_module_perms(self, app_label):
        return self.is_superuser