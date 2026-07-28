import os, sys, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from users.models import User

print("=== All Users ===")
for u in User.objects.all():
    print(f"  ID: {u.id}, Username: {u.username}, Email: {u.email}, Role: {u.role}, Superuser: {u.is_superuser}")

# Reset admin password
user = User.objects.get(username='admin')
user.set_password('admin123')
user.save()
print("\nDONE - Password for 'admin' has been reset to: admin123")
