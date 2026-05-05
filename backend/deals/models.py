from django.db import models
from leads.models import Lead
from contacts.models import Account, Contact
from django.conf import settings

class Deal(models.Model):
    lead = models.OneToOneField(Lead, on_delete=models.PROTECT, related_name="deal", null=True, blank=True)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, null=True, blank=True)
    value = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Old fields for compatibility
    title = models.CharField(max_length=255, blank=True, null=True)
    stage = models.CharField(max_length=50, blank=True, null=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    contact = models.ForeignKey(Contact, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"Deal for {self.account.name if self.account else 'Unknown'}"

class Product(models.Model):
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    
    def __str__(self):
        return self.name

class Quote(models.Model):
    deal = models.ForeignKey(Deal, on_delete=models.CASCADE, related_name="deals_quotes")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="deals_quotes")
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    is_accepted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Quote for {self.deal}"

class Invoice(models.Model):
    deal = models.OneToOneField(Deal, on_delete=models.CASCADE, related_name="deals_invoice")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    is_paid = models.BooleanField(default=False)
    issued_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Invoice for {self.deal}"
