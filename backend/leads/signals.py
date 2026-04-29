from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Lead
from contacts.models import Contact

@receiver(post_save, sender=Lead)
def create_contact_on_lead_qualified(sender, instance, created, **kwargs):
    if instance.status == 'qualified' and not hasattr(instance, 'contact'):
        Contact.objects.create(
            name=instance.name,
            email=instance.email,
            phone=instance.phone,
            company=instance.company,
            linked_lead=instance
        )
