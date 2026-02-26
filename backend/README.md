# Milkman Backend API

A Django REST API for a milk delivery service with subscription management.

## Features

- User authentication with JWT
- Product and category management
- Shopping cart functionality
- Order management
- Payment processing
- Address management
- Admin dashboard capabilities

## Tech Stack

- Django 4.2.7
- Django REST Framework 3.14.0
- PostgreSQL
- JWT Authentication
- Django Filters
- CORS Headers

## Setup Instructions

### 1. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Environment Setup

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Update the following variables in `.env`:
- `SECRET_KEY`: Generate a new Django secret key
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`: Database credentials

### 4. Database Setup

Create PostgreSQL database and run migrations:

```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Create Superuser

```bash
python manage.py createsuperuser
```

### 6. Run Development Server

```bash
python manage.py runserver
```

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - User login
- `POST /api/auth/token/refresh/` - Refresh JWT token
- `GET /api/auth/profile/` - Get user profile
- `PUT /api/auth/profile/update/` - Update user profile

### Categories
- `GET /api/categories/` - List all categories
- `GET /api/categories/{id}/` - Get category details
- `POST /api/categories/` - Create category (Admin)
- `PUT /api/categories/{id}/` - Update category (Admin)
- `DELETE /api/categories/{id}/` - Delete category (Admin)

### Products
- `GET /api/products/` - List products (with pagination, filtering, search)
- `GET /api/products/{id}/` - Get product details
- `POST /api/products/` - Create product (Admin)
- `PUT /api/products/{id}/` - Update product (Admin)
- `DELETE /api/products/{id}/` - Delete product (Admin)

### Cart
- `GET /api/cart/` - View cart
- `POST /api/cart/add/` - Add item to cart
- `PATCH /api/cart/update/{item_id}/` - Update cart item quantity
- `DELETE /api/cart/remove/{item_id}/` - Remove item from cart
- `DELETE /api/cart/clear/` - Clear cart

### Orders
- `POST /api/orders/create/` - Create order from cart
- `GET /api/orders/` - List user orders
- `GET /api/orders/{id}/` - Get order details
- `GET /api/orders/admin/all/` - List all orders (Admin)
- `PATCH /api/orders/{id}/update-status/` - Update order status (Admin)

### Payments
- `POST /api/payments/create/` - Create payment
- `POST /api/payments/verify/` - Verify payment
- `GET /api/payments/{order_id}/` - Get payment details
- `GET /api/payments/admin/all/` - List all payments (Admin)

### Addresses
- `GET /api/addresses/` - List user addresses
- `POST /api/addresses/` - Create address
- `GET /api/addresses/{id}/` - Get address details
- `PUT /api/addresses/{id}/` - Update address
- `DELETE /api/addresses/{id}/` - Delete address

## API Usage Examples

### Register User
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "securepassword123",
    "password_confirm": "securepassword123",
    "phone_number": "1234567890"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

### Add to Cart
```bash
curl -X POST http://localhost:8000/api/cart/add/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 1,
    "quantity": 2,
    "plan_type": "monthly"
  }'
```

## Project Structure

```
backend/
├── manage.py
├── requirements.txt
├── milkman/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── accounts/
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   ├── urls.py
│   └── admin.py
├── products/
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   ├── urls.py
│   └── admin.py
├── cart/
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   ├── urls.py
│   └── admin.py
├── orders/
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   ├── urls.py
│   └── admin.py
├── payments/
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   ├── urls.py
│   └── admin.py
└── addresses/
    ├── models.py
    ├── views.py
    ├── serializers.py
    ├── urls.py
    └── admin.py
```

## Database Schema

The application uses the following main models:
- **User**: Custom user model with role-based permissions
- **Category**: Product categories
- **Product**: Products with multiple pricing plans
- **Cart/CartItem**: Shopping cart functionality
- **Order/OrderItem**: Order management
- **Payment**: Payment processing
- **Address**: User address management

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the access token in the Authorization header:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Permissions

- **Public**: Product listing, category listing, user registration, login
- **Authenticated**: Cart operations, order creation, profile management
- **Admin**: Product/category management, order status updates, user management

## Development

To run tests:
```bash
python manage.py test
```

To create new migrations:
```bash
python manage.py makemigrations
```

To apply migrations:
```bash
python manage.py migrate
```
