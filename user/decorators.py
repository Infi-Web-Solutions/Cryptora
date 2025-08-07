from django.shortcuts import redirect
from django.contrib import messages

def wallet_login_required(view_func):
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            messages.warning(request, "Please connect your wallet to continue.")
            return redirect("connect_wallet")
        return view_func(request, *args, **kwargs)
    return wrapper
