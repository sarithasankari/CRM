from django.contrib.auth.models import AbstractUser
from django.db import models

class Permission(models.Model):
    name = models.CharField(max_length=50, unique=True) # e.g., quote.approve
    description = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return self.name

class Role(models.Model):
    name = models.CharField(max_length=50, unique=True) # e.g., Admin, Manager
    permissions = models.ManyToManyField(Permission, related_name='roles')

    def __str__(self):
        return self.name

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('sales', 'Sales Rep'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='sales')
    team = models.CharField(max_length=100, blank=True, null=True)
    
    # New FK to Role model
    role_fk = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    language = models.CharField(max_length=50, default='English')
    timezone = models.CharField(max_length=50, default='UTC-8')
    theme = models.CharField(max_length=10, default='light')

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

class CompanyProfile(models.Model):
    name = models.CharField(max_length=255, default="Acme Corporation")
    website = models.URLField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    street_address = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return self.name
