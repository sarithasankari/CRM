from django.db import models
from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.conf import settings
from contacts.models import Contact

# ---------------------------------------------------------------------------
# Stage → win probability mapping (mirrors Zoho CRM defaults)
# ---------------------------------------------------------------------------
STAGE_PROBABILITY_MAP = {
    'Qualification': 20,
    'Needs Analysis': 35,
    'Value Proposition': 45,
    'Identify Decision Makers': 55,
    'Proposal/Price Quote': 65,
    'Negotiation/Review': 80,
    'Closed Won': 100,
    'Closed Lost': 0,
    'Closed Lost to Competition': 0,
}


class Deal(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_deals',
    )

    STAGE_CHOICES = tuple(
        (stage, stage) for stage in STAGE_PROBABILITY_MAP.keys()
    )

    title = models.CharField(max_length=255)
    value = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    stage = models.CharField(max_length=50, choices=STAGE_CHOICES, default='Qualification')
    probability = models.IntegerField(
        default=20,
        help_text="Win probability (0–100%). Auto-set from stage via pre_save signal.",
    )
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name='deals')
    expected_close_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


# ---------------------------------------------------------------------------
# Signal: auto-update probability whenever stage changes
# ---------------------------------------------------------------------------
@receiver(pre_save, sender=Deal)
def auto_set_probability(sender, instance, **kwargs):
    """
    Keep probability in sync with the selected stage.
    Only overwrite if the stage has changed (or on first save).
    """
    new_probability = STAGE_PROBABILITY_MAP.get(instance.stage)
    if new_probability is not None:
        instance.probability = new_probability
