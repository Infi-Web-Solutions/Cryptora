# users/

from django import forms

class AdminLoginForm(forms.Form):
    wallet_address = forms.CharField(max_length=255)
    password = forms.CharField(widget=forms.PasswordInput)
