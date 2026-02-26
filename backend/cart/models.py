from django.db import models
from django.contrib.auth import get_user_model
from products.models import Product

User = get_user_model()


class Cart(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Cart"
        verbose_name_plural = "Carts"
    
    def __str__(self):
        return f"Cart for {self.user.username}"
    
    def get_total_price(self):
        return sum(item.get_total_price() for item in self.items.all())
    
    def get_total_items(self):
        return sum(item.quantity for item in self.items.all())


class CartItem(models.Model):
    PLAN_CHOICES = [
        ('one_time', 'One Time'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
    ]
    
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    plan_type = models.CharField(max_length=10, choices=PLAN_CHOICES)
    price_at_time = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['cart', 'product', 'plan_type']
        verbose_name = "Cart Item"
        verbose_name_plural = "Cart Items"
    
    def __str__(self):
        return f"{self.quantity}x {self.product.name} ({self.plan_type}) in {self.cart.user.username}'s cart"
    
    def get_total_price(self):
        return self.quantity * self.price_at_time
    
    def save(self, *args, **kwargs):
        if not self.price_at_time:
            self.price_at_time = self.product.get_price(self.plan_type)
        super().save(*args, **kwargs)
