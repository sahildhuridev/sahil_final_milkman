from django.contrib import admin
from .models import Order, OrderItem


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'total_amount', 'status', 'payment_status', 'created_at']
    list_filter = ['status', 'payment_status', 'created_at']
    search_fields = ['user__username', 'user__email', 'id']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'product', 'quantity', 'plan_type', 'price_at_purchase']
    list_filter = ['plan_type']
    search_fields = ['order__id', 'product__name']
    readonly_fields = ['order', 'product', 'quantity', 'plan_type', 'price_at_purchase']
