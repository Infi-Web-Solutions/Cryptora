from django.db import models
from django.conf import settings  # This allows use of custom user model

class Coin(models.Model):
    name = models.CharField(max_length=50)
    symbol = models.CharField(max_length=20)
    coingecko_id = models.CharField(max_length=100, unique=True)
    current_price = models.FloatField(default=0.0)
    image = models.URLField(blank=True)

    def __str__(self):
        return f"{self.name} ({self.symbol.upper()})"

class Portfolio(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    coin = models.ForeignKey(Coin, on_delete=models.CASCADE)
    quantity = models.FloatField()
    price = models.FloatField()
    total = models.FloatField()

class Transaction(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    coin = models.ForeignKey(Coin, on_delete=models.CASCADE)
    type = models.CharField(max_length=10)  # "buy" or "sell"
    quantity = models.FloatField()
    price = models.FloatField()
    timestamp = models.DateTimeField(auto_now_add=True)

class Watchlist(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    coin = models.ForeignKey(Coin, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('user', 'coin')

class BorrowRequest(models.Model):
    wallet = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=20, decimal_places=2)
    status = models.CharField(max_length=20, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)