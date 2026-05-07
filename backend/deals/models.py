from django.db import models
from leads.models import Lead
from contacts.models import Account, Contact
from django.conf import settings

class Deal(models.Model):
    STATUS_CHOICES = (
        ('open', 'Open'),
        ('won', 'Won'),
        ('lost', 'Lost'),
    )

    lead = models.ForeignKey(Lead, on_delete=models.SET_NULL, related_name="deals", null=True, blank=True)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, null=True, blank=True)
    value = models.DecimalField(max_digits=20, decimal_places=2, default=0.00)
    is_active = models.BooleanField(default=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    # Old fields for compatibility
    title = models.CharField(max_length=255, blank=True, null=True)
    stage = models.CharField(max_length=50, blank=True, null=True, default='proposal')
    expected_close_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    contact = models.ForeignKey(Contact, on_delete=models.SET_NULL, null=True, blank=True)

    @property
    def probability(self):
        mapping = {
            'qualification': 10,
            'needs_analysis': 20,
            'value_proposition': 40,
            'identify_decision_makers': 60,
            'proposal': 75,
            'negotiation': 90,
            'closed_won': 100,
            'closed_lost': 0,
            'closed_lost_to_competition': 0,
        }
        return mapping.get(self.stage.lower() if self.stage else '', 0)

    def clean(self):
        from django.core.exceptions import ValidationError
        from django.utils import timezone

        # 1. Strict Validation: amount & expected_close_date
        if not self.value or self.value <= 0:
            raise ValidationError({'value': 'Deal value must be greater than zero.'})
        if not self.expected_close_date:
            raise ValidationError({'expected_close_date': 'Expected close date is required.'})

        # 2. Ensure only one active deal per lead (Enterprise Rule)
        if self.is_active and self.lead:
            existing = Deal.objects.filter(lead=self.lead, is_active=True)
            if self.pk:
                existing = existing.exclude(pk=self.pk)
            if existing.exists():
                raise ValidationError({'lead': 'An active deal already exists for this lead. Close it before creating a new one.'})

        # 3. Lifecycle Rules: When won/lost → mark closed
        if self.status in ['won', 'lost']:
            self.is_active = False
            if not self.closed_at:
                self.closed_at = timezone.now()
        else:
            self.is_active = True
            self.closed_at = None

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Deal: {self.title or 'Unnamed'} ({self.status})"

class Product(models.Model):
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    
    def __str__(self):
        return self.name

class Quote(models.Model):
    deal = models.ForeignKey(Deal, on_delete=models.CASCADE, related_name="deals_quotes")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="deals_quotes")
    total_amount = models.DecimalField(max_digits=20, decimal_places=2)
    is_accepted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Quote for {self.deal}"

class Invoice(models.Model):
    deal = models.OneToOneField(Deal, on_delete=models.CASCADE, related_name="deals_invoice")
    amount = models.DecimalField(max_digits=20, decimal_places=2)
    is_paid = models.BooleanField(default=False)
    issued_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Invoice for {self.deal}"
