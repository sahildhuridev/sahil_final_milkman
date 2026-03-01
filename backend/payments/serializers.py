from rest_framework import serializers
from .models import Payment
from orders.serializers import OrderSerializer


class PaymentSerializer(serializers.ModelSerializer):
    order_details = OrderSerializer(source='order', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'order', 'order_details', 'payment_method', 'transaction_id',
            'amount', 'status', 'paid_at', 'created_at'
        ]
        read_only_fields = ['transaction_id', 'amount', 'created_at']


class CreatePaymentSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    payment_method = serializers.ChoiceField(choices=Payment.PAYMENT_METHOD_CHOICES)


class VerifyPaymentSerializer(serializers.Serializer):
    payment_id = serializers.IntegerField()
    transaction_id = serializers.CharField(max_length=100)
    status = serializers.ChoiceField(choices=Payment.PAYMENT_STATUS_CHOICES, required=False)
