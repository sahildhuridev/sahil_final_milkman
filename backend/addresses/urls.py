from django.urls import path
from . import views

urlpatterns = [
    path('', views.list_addresses, name='list_addresses'),
    path('create/', views.create_address, name='create_address'),
    path('<int:address_id>/', views.address_detail, name='address_detail'),
    path('<int:address_id>/update/', views.update_address, name='update_address'),
    path('<int:address_id>/delete/', views.delete_address, name='delete_address'),
]
