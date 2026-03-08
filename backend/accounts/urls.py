from django.urls import path
from . import views

urlpatterns = [
    # Authentication endpoints
    path('verify-email/request/', views.request_email_verification, name='request_email_verification'),
    path('verify-email/confirm/', views.confirm_email_verification, name='confirm_email_verification'),
    path('verify-email/status/', views.email_verification_status, name='email_verification_status'),
    path('password-reset/request/', views.request_password_reset, name='request_password_reset'),
    path('password-reset/validate/', views.validate_password_reset_token, name='validate_password_reset_token'),
    path('password-reset/confirm/', views.confirm_password_reset, name='confirm_password_reset'),
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('token/refresh/', views.token_refresh, name='token_refresh'),
    path('profile/', views.profile, name='profile'),
    path('profile/update/', views.update_profile, name='update_profile'),
    
    # Admin user management
    path('users/', views.list_users, name='list_users'),
    path('users/<int:user_id>/', views.user_detail, name='user_detail'),
    path('users/<int:user_id>/deactivate/', views.deactivate_user, name='deactivate_user'),
    path('users/<int:user_id>/activate/', views.activate_user, name='activate_user'),
]
