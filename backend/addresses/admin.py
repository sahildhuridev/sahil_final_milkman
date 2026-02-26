from django.contrib import admin
from .models import Address


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ['user', 'address_line', 'city', 'state', 'pincode', 'is_default']
    list_filter = ['is_default', 'city', 'state']
    search_fields = ['user__username', 'user__email', 'address_line', 'city']
