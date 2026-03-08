import base64
import json
import uuid
from datetime import timedelta
from urllib import error as urlerror
from urllib import request as urlrequest

from decouple import config
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from orders.models import Order
from .models import Payment
from .serializers import CreatePaymentSerializer, PaymentSerializer, VerifyPaymentSerializer


# PayPal setup notes:
# 1) Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in backend/.env.
# 2) In your PayPal developer app, configure return/cancel URLs to match:
#    {FRONTEND_BASE_URL}/checkout?paypal=success and {FRONTEND_BASE_URL}/checkout?paypal=cancel
# 3) Keep PAYPAL_MODE=sandbox for testing, switch to live in production.
PAYPAL_MODE = config('PAYPAL_MODE', default='sandbox').lower()
PAYPAL_CLIENT_ID = config('PAYPAL_CLIENT_ID', default='')
PAYPAL_CLIENT_SECRET = config('PAYPAL_CLIENT_SECRET', default='')
PAYPAL_CURRENCY = config('PAYPAL_CURRENCY', default='USD')
FRONTEND_BASE_URL = config('FRONTEND_BASE_URL', default='http://localhost:5173').rstrip('/')
PAYPAL_TIMEOUT_MINUTES = config('PAYPAL_TIMEOUT_MINUTES', default=5, cast=int)

PAYPAL_API_BASE = 'https://api-m.sandbox.paypal.com' if PAYPAL_MODE == 'sandbox' else 'https://api-m.paypal.com'


def _paypal_timeout_deadline(payment):
    return payment.created_at + timedelta(minutes=PAYPAL_TIMEOUT_MINUTES)


def _expire_stale_payment_if_needed(payment):
    if payment.payment_method != 'paypal' or payment.status != 'pending':
        return False

    if timezone.now() > _paypal_timeout_deadline(payment):
        payment.mark_as_failed()
        return True

    return False


def _expire_stale_paypal_payments(queryset):
    for payment in queryset:
        _expire_stale_payment_if_needed(payment)


def _paypal_request(path, method='GET', token=None, payload=None, form_encoded=False):
    url = f'{PAYPAL_API_BASE}{path}'
    headers = {'Accept': 'application/json'}

    body = None
    if payload is not None:
        if form_encoded:
            body = payload.encode('utf-8')
            headers['Content-Type'] = 'application/x-www-form-urlencoded'
        else:
            body = json.dumps(payload).encode('utf-8')
            headers['Content-Type'] = 'application/json'

    if token:
        headers['Authorization'] = f'Bearer {token}'

    req = urlrequest.Request(url=url, data=body, method=method, headers=headers)

    try:
        with urlrequest.urlopen(req, timeout=20) as resp:
            raw = resp.read().decode('utf-8')
            return resp.status, json.loads(raw) if raw else {}
    except urlerror.HTTPError as e:
        raw = e.read().decode('utf-8') if e.fp else ''
        try:
            data = json.loads(raw) if raw else {'error': str(e)}
        except json.JSONDecodeError:
            data = {'error': raw or str(e)}
        return e.code, data
    except Exception as e:
        return 500, {'error': str(e)}


def _get_paypal_access_token():
    if not PAYPAL_CLIENT_ID or not PAYPAL_CLIENT_SECRET:
        return None, {'error': 'PayPal credentials are missing'}

    encoded = base64.b64encode(f'{PAYPAL_CLIENT_ID}:{PAYPAL_CLIENT_SECRET}'.encode('utf-8')).decode('utf-8')

    url = f'{PAYPAL_API_BASE}/v1/oauth2/token'
    headers = {
        'Authorization': f'Basic {encoded}',
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
    }

    req = urlrequest.Request(
        url=url,
        data='grant_type=client_credentials'.encode('utf-8'),
        method='POST',
        headers=headers,
    )

    try:
        with urlrequest.urlopen(req, timeout=20) as resp:
            raw = resp.read().decode('utf-8')
            data = json.loads(raw) if raw else {}
            token = data.get('access_token')
            if not token:
                return None, {'error': 'PayPal token missing in response'}
            return token, None
    except urlerror.HTTPError as e:
        raw = e.read().decode('utf-8') if e.fp else ''
        try:
            data = json.loads(raw) if raw else {'error': str(e)}
        except json.JSONDecodeError:
            data = {'error': raw or str(e)}
        return None, data
    except Exception as e:
        return None, {'error': str(e)}


def _create_paypal_order(order, payment):
    token, token_error = _get_paypal_access_token()
    if not token:
        return None, token_error or {'error': 'Unable to authenticate with PayPal'}

    success_url = f'{FRONTEND_BASE_URL}/checkout?paypal=success&payment_id={payment.id}'
    cancel_url = f'{FRONTEND_BASE_URL}/checkout?paypal=cancel&payment_id={payment.id}'

    payload = {
        'intent': 'CAPTURE',
        'purchase_units': [
            {
                'reference_id': str(order.id),
                'amount': {
                    'currency_code': PAYPAL_CURRENCY,
                    'value': str(order.total_amount),
                },
            }
        ],
        'application_context': {
            'return_url': success_url,
            'cancel_url': cancel_url,
            'user_action': 'PAY_NOW',
        },
    }

    status_code, data = _paypal_request(
        path='/v2/checkout/orders',
        method='POST',
        token=token,
        payload=payload,
    )

    if status_code not in (200, 201):
        return None, data

    approval_url = None
    for link in data.get('links', []):
        if link.get('rel') == 'approve':
            approval_url = link.get('href')
            break

    order_id = data.get('id')
    if not approval_url or not order_id:
        return None, {'error': 'PayPal approval URL not found'}

    payment.transaction_id = order_id
    payment.save(update_fields=['transaction_id'])

    return {'approval_url': approval_url, 'paypal_order_id': order_id}, None


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

        existing = Payment.objects.filter(order=order).first()

        if existing:
            _expire_stale_payment_if_needed(existing)
            existing.refresh_from_db()

            if existing.status == 'completed':
                return Response({'error': 'Order payment already completed'}, status=status.HTTP_400_BAD_REQUEST)
            if existing.status == 'failed':
                return Response({'error': 'Previous payment attempt failed. Create a new order to retry.'}, status=status.HTTP_400_BAD_REQUEST)

            payment = existing
        else:
            payment = Payment.objects.create(
                order=order,
                payment_method=payment_method,
                amount=order.total_amount,
                transaction_id=f'TXN_{uuid.uuid4().hex[:12].upper()}',
            )

        if payment_method == 'paypal':
            payment.payment_method = 'paypal'
            payment.status = 'pending'
            payment.paid_at = None
            payment.save(update_fields=['payment_method', 'status', 'paid_at'])

            paypal_data, paypal_error = _create_paypal_order(order, payment)
            if paypal_error:
                return Response(
                    {
                        'error': 'Failed to create PayPal payment',
                        'details': paypal_error,
                    },
                    status=status.HTTP_502_BAD_GATEWAY,
                )

            out = PaymentSerializer(payment).data
            out.update(paypal_data)
            out['expires_in_minutes'] = PAYPAL_TIMEOUT_MINUTES
            return Response(out, status=status.HTTP_201_CREATED)

        serializer = PaymentSerializer(payment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def capture_paypal_payment(request):
    paypal_order_id = request.data.get('paypal_order_id')
    payment_id = request.data.get('payment_id')

    if not paypal_order_id:
        return Response({'error': 'paypal_order_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    payment = Payment.objects.filter(order__user=request.user, transaction_id=paypal_order_id).first()
    if not payment and payment_id:
        payment = Payment.objects.filter(order__user=request.user, id=payment_id).first()

    if not payment:
        return Response({'error': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)

    if payment.payment_method != 'paypal':
        return Response({'error': 'Payment is not a PayPal payment'}, status=status.HTTP_400_BAD_REQUEST)

    if _expire_stale_payment_if_needed(payment):
        return Response(
            {
                'error': f'Payment session expired after {PAYPAL_TIMEOUT_MINUTES} minutes',
                'payment': PaymentSerializer(payment).data,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    payment.refresh_from_db()
    if payment.status == 'completed':
        return Response({'message': 'Payment already captured', 'payment': PaymentSerializer(payment).data})
    if payment.status == 'failed':
        return Response({'error': 'Payment already failed'}, status=status.HTTP_400_BAD_REQUEST)

    token, token_error = _get_paypal_access_token()
    if not token:
        return Response({'error': 'PayPal auth failed', 'details': token_error}, status=status.HTTP_502_BAD_GATEWAY)

    status_code, data = _paypal_request(
        path=f'/v2/checkout/orders/{paypal_order_id}/capture',
        method='POST',
        token=token,
        payload={},
    )

    if status_code not in (200, 201):
        return Response({'error': 'PayPal capture failed', 'details': data}, status=status.HTTP_502_BAD_GATEWAY)

    if data.get('status') == 'COMPLETED':
        payment.mark_as_completed()
        payment.refresh_from_db()
        return Response(
            {
                'message': 'Payment captured successfully',
                'payment': PaymentSerializer(payment).data,
            },
            status=status.HTTP_200_OK,
        )

    return Response({'error': 'PayPal payment is not completed', 'details': data}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cancel_paypal_payment(request):
    payment_id = request.data.get('payment_id')
    paypal_order_id = request.data.get('paypal_order_id')

    payment = None
    if payment_id:
        payment = Payment.objects.filter(id=payment_id, order__user=request.user).first()
    if not payment and paypal_order_id:
        payment = Payment.objects.filter(transaction_id=paypal_order_id, order__user=request.user).first()

    if not payment:
        return Response({'error': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)

    if payment.payment_method != 'paypal':
        return Response({'error': 'Payment is not a PayPal payment'}, status=status.HTTP_400_BAD_REQUEST)

    if payment.status == 'pending':
        payment.mark_as_failed()

    return Response({'message': 'PayPal payment cancelled', 'payment': PaymentSerializer(payment).data}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verify_payment(request):
    serializer = VerifyPaymentSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    payment_id = serializer.validated_data['payment_id']
    transaction_id = serializer.validated_data['transaction_id']
    requested_status = serializer.validated_data.get('status')

    try:
        payment = Payment.objects.get(id=payment_id, order__user=request.user)

        if payment.status == 'completed':
            return Response({'message': 'Payment already verified'}, status=status.HTTP_200_OK)
        if payment.status == 'failed':
            return Response({'message': 'Payment already marked as failed'}, status=status.HTTP_200_OK)

        payment.transaction_id = transaction_id

        if requested_status == 'failed':
            payment.mark_as_failed()
        else:
            payment.mark_as_completed()

        return Response(
            {
                'message': 'Payment verified successfully',
                'payment': PaymentSerializer(payment).data,
            },
            status=status.HTTP_200_OK,
        )

    except Payment.DoesNotExist:
        return Response({'error': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def payment_detail(request, order_id):
    try:
        order = Order.objects.get(id=order_id, user=request.user)
        payment = get_object_or_404(Payment, order=order)
        _expire_stale_payment_if_needed(payment)
        payment.refresh_from_db()
        serializer = PaymentSerializer(payment)
        return Response(serializer.data)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def list_all_payments(request):
    pending_paypal = Payment.objects.filter(payment_method='paypal', status='pending')
    _expire_stale_paypal_payments(pending_paypal)

    payments = Payment.objects.all().order_by('-created_at')
    serializer = PaymentSerializer(payments, many=True)
    return Response(serializer.data)
