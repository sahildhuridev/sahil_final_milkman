from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'order', 'payment_method', 'amount', 'status', 'paid_at']
    list_filter = ['payment_method', 'status', 'paid_at']
    search_fields = ['order__id', 'transaction_id']
    readonly_fields = ['created_at', 'paid_at']
    ordering = ['-created_at']
