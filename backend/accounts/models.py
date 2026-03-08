from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from datetime import timedelta


class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('customer', 'Customer'),
    ]
    
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    profile_photo = models.ImageField(upload_to='profiles/', blank=True, null=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='customer')
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'phone_number']
    
    def __str__(self):
        return f"{self.username} ({self.email})"
    
    @property
    def is_admin(self):
        return self.role == 'admin'
    
    @property
    def is_customer(self):
        return self.role == 'customer'


class EmailVerificationRequest(models.Model):
    email = models.EmailField(unique=True)
    token = models.CharField(max_length=128, unique=True)
    is_verified = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    verified_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        status = 'verified' if self.is_verified else 'pending'
        return f'{self.email} ({status})'

    @staticmethod
    def default_expiry(minutes=30):
        return timezone.now() + timedelta(minutes=minutes)

    def is_expired(self):
        return timezone.now() > self.expires_at


class PasswordResetRequest(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_requests')
    token = models.CharField(max_length=128, unique=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    used_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Password reset for {self.user.email}'

    def is_expired(self):
        return timezone.now() > self.expires_at
