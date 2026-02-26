from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
import uuid
from .models import Payment
from .serializers import PaymentSerializer, CreatePaymentSerializer, VerifyPaymentSerializer
from orders.models import Order


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_payment(request):
    serializer = CreatePaymentSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    order_id = serializer.validated_data['order_id']
    payment_method = serializer.validated_data['payment_method']
    
    try:
        order = Order.objects.get(id=order_id, user=request.user)
        
        if order.payment_status == 'paid':
            return Response({'error': 'Order is already paid'}, status=status.HTTP_400_BAD_REQUEST)
        
        if Payment.objects.filter(order=order).exists():
            payment = Payment.objects.get(order=order)
            serializer = PaymentSerializer(payment)
            return Response(serializer.data)
        
        payment = Payment.objects.create(
            order=order,
            payment_method=payment_method,
            amount=order.total_amount,
            transaction_id=f"TXN_{uuid.uuid4().hex[:12].upper()}"
        )
        
        serializer = PaymentSerializer(payment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verify_payment(request):
    serializer = VerifyPaymentSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    payment_id = serializer.validated_data['payment_id']
    transaction_id = serializer.validated_data['transaction_id']
    
    try:
        payment = Payment.objects.get(id=payment_id, order__user=request.user)
        
        if payment.status == 'completed':
            return Response({'message': 'Payment already verified'}, status=status.HTTP_200_OK)
        
        payment.transaction_id = transaction_id
        payment.mark_as_completed()
        
        return Response({
            'message': 'Payment verified successfully',
            'payment': PaymentSerializer(payment).data
        }, status=status.HTTP_200_OK)
    
    except Payment.DoesNotExist:
        return Response({'error': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def payment_detail(request, order_id):
    try:
        order = Order.objects.get(id=order_id, user=request.user)
        payment = get_object_or_404(Payment, order=order)
        serializer = PaymentSerializer(payment)
        return Response(serializer.data)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def list_all_payments(request):
    payments = Payment.objects.all().order_by('-created_at')
    serializer = PaymentSerializer(payments, many=True)
    return Response(serializer.data)
