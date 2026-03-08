from django.urls import path
from . import views

urlpatterns = [
    # Customer endpoints
    path('create/', views.create_order, name='create_order'),
    path('', views.list_orders, name='list_orders'),
    path('<int:order_id>/', views.order_detail, name='order_detail'),
    path('<int:order_id>/invoice/', views.download_invoice, name='download_invoice'),
    
    # Admin endpoints
    path('admin/all/', views.list_all_orders, name='list_all_orders'),
    path('<int:order_id>/update-status/', views.update_order_status, name='update_order_status'),
]
