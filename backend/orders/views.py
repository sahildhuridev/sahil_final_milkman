from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.http import HttpResponse
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas
from .models import Order, OrderItem
from .serializers import OrderSerializer, CreateOrderSerializer, OrderStatusUpdateSerializer
from cart.models import Cart, CartItem
from products.models import Product
from payments.models import Payment


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_order(request):
    serializer = CreateOrderSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        cart = Cart.objects.get(user=request.user)
        cart_items = cart.items.all()
        
        if not cart_items:
            return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            order = Order.objects.create(
                user=request.user,
                total_amount=cart.get_total_price(),
                shipping_address=serializer.validated_data['shipping_address']
            )
            
            for cart_item in cart_items:
                OrderItem.objects.create(
                    order=order,
                    product=cart_item.product,
                    quantity=cart_item.quantity,
                    plan_type=cart_item.plan_type,
                    price_at_purchase=cart_item.price_at_time
                )
                
                product = cart_item.product
                product.stock_quantity -= cart_item.quantity
                product.save()
            
            cart_items.delete()
        
        serializer = OrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    except Cart.DoesNotExist:
        return Response({'error': 'Cart not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_orders(request):
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def order_detail(request, order_id):
    try:
        order = Order.objects.get(id=order_id, user=request.user)
        serializer = OrderSerializer(order)
        return Response(serializer.data)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def list_all_orders(request):
    orders = Order.objects.all().order_by('-created_at')
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([permissions.IsAdminUser])
def update_order_status(request, order_id):
    try:
        order = Order.objects.get(id=order_id)
        serializer = OrderStatusUpdateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        order.status = serializer.validated_data['status']
        order.save()
        
        serializer = OrderSerializer(order)
        return Response(serializer.data)
    
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def download_invoice(request, order_id):
    try:
        order = Order.objects.prefetch_related('items__product').get(id=order_id, user=request.user)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    payment = Payment.objects.filter(order=order).first()

    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    margin_x = 18 * mm
    y = height - 20 * mm

    def draw_line(space=6):
        nonlocal y
        pdf.setStrokeColor(colors.HexColor('#D9E2EC'))
        pdf.line(margin_x, y, width - margin_x, y)
        y -= space * mm

    def text(label, value, size=10, bold=False, gap=5):
        nonlocal y
        pdf.setFont('Helvetica-Bold' if bold else 'Helvetica', size)
        pdf.setFillColor(colors.HexColor('#102018'))
        pdf.drawString(margin_x, y, label)
        pdf.setFont('Helvetica', size)
        pdf.drawString(margin_x + 48 * mm, y, value or '-')
        y -= gap * mm

    # Header
    pdf.setFillColor(colors.HexColor('#102018'))
    pdf.setFont('Helvetica-Bold', 20)
    pdf.drawString(margin_x, y, 'Milkman Invoice')
    y -= 8 * mm
    pdf.setFont('Helvetica', 10)
    pdf.setFillColor(colors.HexColor('#4A5568'))
    pdf.drawString(margin_x, y, f'Invoice for Order #{order.id}')
    y -= 7 * mm
    draw_line()

    # Customer details
    pdf.setFont('Helvetica-Bold', 12)
    pdf.setFillColor(colors.HexColor('#102018'))
    pdf.drawString(margin_x, y, 'Customer Details')
    y -= 6 * mm
    text('Name', order.user.username or '-')
    text('Email', order.user.email or '-')
    text('Contact', order.user.phone_number or '-')
    draw_line()

    # Order details
    pdf.setFont('Helvetica-Bold', 12)
    pdf.drawString(margin_x, y, 'Order Details')
    y -= 6 * mm
    text('Order ID', str(order.id))
    text('Order Date', order.created_at.strftime('%Y-%m-%d %H:%M:%S'))
    text('Order Status', order.status)
    text('Payment Status', order.payment_status)
    draw_line()

    # Address
    pdf.setFont('Helvetica-Bold', 12)
    pdf.drawString(margin_x, y, 'Shipping Address')
    y -= 6 * mm
    pdf.setFont('Helvetica', 10)
    pdf.setFillColor(colors.HexColor('#102018'))
    address_lines = order.shipping_address.split(',') if order.shipping_address else ['-']
    for line in address_lines:
        pdf.drawString(margin_x, y, line.strip())
        y -= 5 * mm
    draw_line()

    # Payment details
    pdf.setFont('Helvetica-Bold', 12)
    pdf.drawString(margin_x, y, 'Payment Details')
    y -= 6 * mm
    text('Method', payment.payment_method if payment else '-')
    text('Transaction', payment.transaction_id if payment else '-')
    text('Paid At', payment.paid_at.strftime('%Y-%m-%d %H:%M:%S') if payment and payment.paid_at else '-')
    draw_line()

    # Items table header
    pdf.setFont('Helvetica-Bold', 11)
    pdf.setFillColor(colors.HexColor('#102018'))
    pdf.drawString(margin_x, y, 'Product')
    pdf.drawString(margin_x + 70 * mm, y, 'Plan')
    pdf.drawString(margin_x + 98 * mm, y, 'Qty')
    pdf.drawString(margin_x + 115 * mm, y, 'Unit')
    pdf.drawString(margin_x + 145 * mm, y, 'Total')
    y -= 5 * mm
    draw_line(space=4)

    # Items rows
    for item in order.items.all():
        if y < 35 * mm:
            pdf.showPage()
            y = height - 20 * mm
        product_name = (item.product.name or '-')[:30]
        unit_price = item.price_at_purchase
        line_total = item.get_total_price()

        pdf.setFont('Helvetica', 10)
        pdf.setFillColor(colors.HexColor('#102018'))
        pdf.drawString(margin_x, y, product_name)
        pdf.drawString(margin_x + 70 * mm, y, item.plan_type)
        pdf.drawRightString(margin_x + 108 * mm, y, str(item.quantity))
        pdf.drawRightString(margin_x + 138 * mm, y, f'Rs {unit_price}')
        pdf.drawRightString(margin_x + 170 * mm, y, f'Rs {line_total}')
        y -= 6 * mm

    draw_line()

    # Totals
    pdf.setFont('Helvetica-Bold', 12)
    pdf.setFillColor(colors.HexColor('#102018'))
    pdf.drawRightString(margin_x + 170 * mm, y, f'Grand Total: Rs {order.total_amount}')
    y -= 10 * mm

    # Footer
    pdf.setFont('Helvetica', 9)
    pdf.setFillColor(colors.HexColor('#4A5568'))
    pdf.drawString(margin_x, y, 'Thank you for shopping with Milkman.')
    y -= 4 * mm
    pdf.drawString(margin_x, y, 'This is a system-generated invoice and does not require signature.')

    pdf.showPage()
    pdf.save()

    pdf_data = buffer.getvalue()
    buffer.close()

    response = HttpResponse(pdf_data, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename=\"bill-order-{order.id}.pdf\"'
    return response
