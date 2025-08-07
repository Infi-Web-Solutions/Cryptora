from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import WalletUser

@admin.register(WalletUser)
class WalletUserAdmin(BaseUserAdmin):
    list_display = ("wallet_address", "is_staff", "is_superuser", "is_active", "date_joined")
    search_fields = ("wallet_address",)
    ordering = ("wallet_address",)
    readonly_fields = ("date_joined",)

    fieldsets = (
        (None, {"fields": ("wallet_address", "password")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Dates", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("wallet_address", "password1", "password2", "is_staff", "is_superuser"),
        }),
    )

    filter_horizontal = ("groups", "user_permissions")
