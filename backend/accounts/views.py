import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import EmailVerificationRequest
from .serializers import (
    EmailVerificationRequestSerializer,
    EmailVerificationStatusSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    UserRegistrationSerializer,
)
from .models import PasswordResetRequest

User = get_user_model()


def _verification_expiry_minutes():
    return int(getattr(settings, 'EMAIL_VERIFICATION_EXPIRY_MINUTES', 30))


def _frontend_base_url():
    return getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:5173').rstrip('/')


def _password_reset_expiry_minutes():
    return int(getattr(settings, 'PASSWORD_RESET_EXPIRY_MINUTES', 30))


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def request_email_verification(request):
    serializer = EmailVerificationRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data['email'].strip().lower()

    if User.objects.filter(email=email).exists():
        return Response({'error': 'This email is already registered.'}, status=status.HTTP_400_BAD_REQUEST)

    token = secrets.token_urlsafe(48)
    expires_at = timezone.now() + timedelta(minutes=_verification_expiry_minutes())

    verification, _ = EmailVerificationRequest.objects.update_or_create(
        email=email,
        defaults={
            'token': token,
            'is_verified': False,
            'verified_at': None,
            'expires_at': expires_at,
        },
    )

    verify_link = f"{_frontend_base_url()}/verify-email?token={verification.token}"

    subject = "Welcome to Sahil's Milkman - Verify Your Email"
    message = (
        "Welcome to Sahil's Milkman website.\n\n"
        "Please verify your email address before signing in and creating your account.\n\n"
        f"Verification link: {verify_link}\n\n"
        f"This link expires in {_verification_expiry_minutes()} minutes."
    )

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@milkman.local'),
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception as e:
        return Response(
            {'error': 'Failed to send verification email', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response(
        {
            'message': 'Verification email sent successfully.',
            'email': email,
            'expires_in_minutes': _verification_expiry_minutes(),
        },
        status=status.HTTP_200_OK,
    )


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def confirm_email_verification(request):
    token = request.query_params.get('token', '').strip()
    if not token:
        return Response({'error': 'Verification token is required.'}, status=status.HTTP_400_BAD_REQUEST)

    verification = EmailVerificationRequest.objects.filter(token=token).first()
    if not verification:
        return Response({'error': 'Invalid verification token.'}, status=status.HTTP_400_BAD_REQUEST)

    if verification.is_verified:
        return Response({'message': 'Email already verified.', 'email': verification.email}, status=status.HTTP_200_OK)

    if verification.is_expired():
        return Response({'error': 'Verification link has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

    verification.is_verified = True
    verification.verified_at = timezone.now()
    verification.save(update_fields=['is_verified', 'verified_at', 'updated_at'])

    return Response({'message': 'Email verified successfully.', 'email': verification.email}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def email_verification_status(request):
    serializer = EmailVerificationStatusSerializer(data={'email': request.query_params.get('email', '')})
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data['email'].strip().lower()
    verification = EmailVerificationRequest.objects.filter(email=email).first()

    is_verified = bool(verification and verification.is_verified and not verification.is_expired())

    return Response(
        {
            'email': email,
            'is_verified': is_verified,
            'expires_at': verification.expires_at if verification else None,
        },
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def request_password_reset(request):
    serializer = PasswordResetRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data['email'].strip().lower()
    user = User.objects.filter(email=email).first()
    if not user:
        return Response({'error': 'Email not registered'}, status=status.HTTP_400_BAD_REQUEST)

    token = secrets.token_urlsafe(48)
    expires_at = timezone.now() + timedelta(minutes=_password_reset_expiry_minutes())
    reset = PasswordResetRequest.objects.create(
        user=user,
        token=token,
        expires_at=expires_at,
        is_used=False,
    )

    reset_link = f"{_frontend_base_url()}/reset-password?token={reset.token}"

    subject = "Sahil's Milkman - Reset Your Password"
    message = (
        "You requested to reset your password.\n\n"
        "Please click the link below to set a new password:\n"
        f"{reset_link}\n\n"
        f"This link expires in {_password_reset_expiry_minutes()} minutes."
    )

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@milkman.local'),
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception as e:
        return Response(
            {'error': 'Failed to send password reset email', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response(
        {
            'message': 'Password reset email sent successfully.',
            'email': email,
            'expires_in_minutes': _password_reset_expiry_minutes(),
        },
        status=status.HTTP_200_OK,
    )


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def validate_password_reset_token(request):
    token = request.query_params.get('token', '').strip()
    if not token:
        return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)

    reset = PasswordResetRequest.objects.filter(token=token).first()
    if not reset:
        return Response({'error': 'Invalid password reset token'}, status=status.HTTP_400_BAD_REQUEST)
    if reset.is_used:
        return Response({'error': 'This password reset link is already used'}, status=status.HTTP_400_BAD_REQUEST)
    if reset.is_expired():
        return Response({'error': 'This password reset link has expired'}, status=status.HTTP_400_BAD_REQUEST)

    return Response({'message': 'Token is valid', 'email': reset.user.email}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def confirm_password_reset(request):
    serializer = PasswordResetConfirmSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    token = serializer.validated_data['token']
    new_password = serializer.validated_data['new_password']

    reset = PasswordResetRequest.objects.filter(token=token).first()
    if not reset:
        return Response({'error': 'Invalid password reset token'}, status=status.HTTP_400_BAD_REQUEST)
    if reset.is_used:
        return Response({'error': 'This password reset link is already used'}, status=status.HTTP_400_BAD_REQUEST)
    if reset.is_expired():
        return Response({'error': 'This password reset link has expired'}, status=status.HTTP_400_BAD_REQUEST)

    user = reset.user
    user.set_password(new_password)
    user.save()

    reset.is_used = True
    reset.used_at = timezone.now()
    reset.save(update_fields=['is_used', 'used_at'])

    return Response({'message': 'Password changed successfully. You can now login.'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register(request):
    email = (request.data.get('email') or '').strip().lower()
    if not email:
        return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

    verification = EmailVerificationRequest.objects.filter(email=email).first()
    if not verification or not verification.is_verified or verification.is_expired():
        return Response(
            {'error': 'Please verify your email address before creating an account.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)

        EmailVerificationRequest.objects.filter(email=email).delete()

        return Response(
            {
                'message': 'User registered successfully',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserProfileSerializer(user, context={'request': request}).data,
            },
            status=status.HTTP_201_CREATED,
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login(request):
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserProfileSerializer(user, context={'request': request}).data,
            },
            status=status.HTTP_200_OK,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def token_refresh(request):
    try:
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'error': 'Refresh token required'}, status=status.HTTP_400_BAD_REQUEST)

        refresh = RefreshToken(refresh_token)
        return Response({'access': str(refresh.access_token)}, status=status.HTTP_200_OK)
    except Exception:
        return Response({'error': 'Invalid refresh token'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    serializer = UserProfileSerializer(request.user, context={'request': request})
    return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    serializer = UserProfileSerializer(request.user, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_users(request):
    users = User.objects.filter(role='customer').order_by('-date_joined')
    serializer = UserProfileSerializer(users, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def user_detail(request, user_id):
    try:
        user = User.objects.get(id=user_id, role='customer')
        serializer = UserProfileSerializer(user, context={'request': request})
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def deactivate_user(request, user_id):
    try:
        user = User.objects.get(id=user_id, role='customer')
        user.is_active = False
        user.save()
        return Response({'message': 'User banned successfully', 'is_active': user.is_active})
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def activate_user(request, user_id):
    try:
        user = User.objects.get(id=user_id, role='customer')
        user.is_active = True
        user.save()
        return Response({'message': 'User unbanned successfully', 'is_active': user.is_active})
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
