from django.urls import path
from . import views

urlpatterns = [
    path('create/', views.create_payment, name='create_payment'),
    path('verify/', views.verify_payment, name='verify_payment'),
    path('<int:order_id>/', views.payment_detail, name='payment_detail'),
    path('admin/all/', views.list_all_payments, name='list_all_payments'),
]
