from django.urls import path
from . import views

urlpatterns = [
    path('stats/', views.dashboard_stats, name='dashboard_stats'),
    path('sales/', views.dashboard_sales, name='dashboard_sales'),
    path('top-products/', views.dashboard_top_products, name='dashboard_top_products'),
]

