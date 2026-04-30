from django.db import models
from django.conf import settings
from contacts.models import Contact

class Deal(models.Model):
    STAGE_CHOICES = (
        ('Qualification', 'Qualification'),
        ('Needs Analysis', 'Needs Analysis'),
        ('Value Proposition', 'Value Proposition'),
        ('Identify Decision Makers', 'Identify Decision Makers'),
        ('Proposal/Price Quote', 'Proposal/Price Quote'),
        ('Negotiation/Review', 'Negotiation/Review'),
        ('Closed Won', 'Closed Won'),
        ('Closed Lost', 'Closed Lost'),
        ('Closed Lost to Competition', 'Closed Lost to Competition'),
    )
    
    title = models.CharField(max_length=255)
    value = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    stage = models.CharField(max_length=50, choices=STAGE_CHOICES, db_index=True)
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name='deals')
    probability = models.IntegerField(default=0)
    expected_close_date = models.DateField(null=True, blank=True)
    proposal_doc = models.FileField(upload_to='proposals/', blank=True, null=True)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='deals')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
