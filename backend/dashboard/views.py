from decimal import Decimal
from datetime import timedelta
from django.contrib.auth import get_user_model
from django.db.models import Count, DecimalField, ExpressionWrapper, F, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from orders.models import Order, OrderItem
from payments.models import Payment


def _decimal_to_float(value):
    if value is None:
        return 0.0
    return float(value)


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def dashboard_stats(request):
    user_model = get_user_model()

    total_orders = Order.objects.count()
    total_revenue = Payment.objects.filter(status='completed').aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

    payment_counts = {
        status: Payment.objects.filter(status=status).count()
        for status, _ in Payment.PAYMENT_STATUS_CHOICES
    }
    order_counts = {
        status: Order.objects.filter(status=status).count()
        for status, _ in Order.ORDER_STATUS_CHOICES
    }

    total_customers = user_model.objects.filter(role='customer').count()
    total_admins = user_model.objects.filter(role='admin').count()

    return Response(
        {
            'kpis': {
                'total_revenue': _decimal_to_float(total_revenue),
                'total_orders': total_orders,
                'total_customers': total_customers,
                'total_admins': total_admins,
                'completed_payments': payment_counts.get('completed', 0),
                'failed_payments': payment_counts.get('failed', 0),
                'pending_payments': payment_counts.get('pending', 0),
            },
            'order_status_breakdown': order_counts,
            'payment_status_breakdown': payment_counts,
        }
    )


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def dashboard_sales(request):
    days = int(request.query_params.get('days', 7))
    if days < 1:
        days = 1
    if days > 90:
        days = 90

    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=days - 1)

    daily_queryset = (
        Payment.objects.filter(status='completed', paid_at__date__gte=start_date, paid_at__date__lte=end_date)
        .annotate(day=TruncDate('paid_at'))
        .values('day')
        .annotate(
            revenue=Sum('amount'),
            orders=Count('order', distinct=True),
        )
        .order_by('day')
    )

    by_day = {row['day']: row for row in daily_queryset if row.get('day')}
    labels = []
    revenue = []
    orders = []

    for i in range(days):
        day = start_date + timedelta(days=i)
        row = by_day.get(day)
        labels.append(day.strftime('%d %b'))
        revenue.append(_decimal_to_float(row['revenue']) if row else 0.0)
        orders.append(row['orders'] if row else 0)

    return Response(
        {
            'labels': labels,
            'revenue': revenue,
            'orders': orders,
        }
    )


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def dashboard_top_products(request):
    limit = int(request.query_params.get('limit', 10))
    if limit < 1:
        limit = 1
    if limit > 50:
        limit = 50

    total_price_expr = ExpressionWrapper(
        F('quantity') * F('price_at_purchase'),
        output_field=DecimalField(max_digits=12, decimal_places=2),
    )

    rows = (
        OrderItem.objects.filter(order__payment_status='paid')
        .values('product_id', 'product__name')
        .annotate(
            total_quantity=Sum('quantity'),
            total_times_bought=Count('id'),
            distinct_orders=Count('order', distinct=True),
            total_revenue=Sum(total_price_expr),
        )
        .order_by('-total_quantity', '-total_times_bought')[:limit]
    )

    data = [
        {
            'product_id': row['product_id'],
            'product_name': row['product__name'],
            'total_quantity': row['total_quantity'] or 0,
            'total_times_bought': row['total_times_bought'] or 0,
            'distinct_orders': row['distinct_orders'] or 0,
            'total_revenue': _decimal_to_float(row['total_revenue']),
        }
        for row in rows
    ]

    return Response({'results': data})
