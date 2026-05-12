import os
import sys
import pymysql
pymysql.version_info = (2, 2, 8, 'final', 0)
pymysql.install_as_MySQLdb()

import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')
django.setup()

from users.models import Role, Permission, User

def seed_rbac():
    print("Seeding RBAC...")
    
    # Define permissions
    permissions_list = [
        ('quote.create', 'Can create quotes'),
        ('quote.edit', 'Can edit quotes'),
        ('quote.approve', 'Can approve quotes'),
        ('invoice.generate', 'Can generate invoices'),
        ('invoice.send', 'Can send invoices'),
        ('invoice.mark_paid', 'Can mark invoices as paid'),
        ('lead.view', 'Can view leads'),
        ('lead.edit', 'Can edit leads'),
        ('report.view', 'Can view reports'),
        ('admin.access', 'Full admin access'),
    ]
    
    perms = {}
    for name, desc in permissions_list:
        perm, created = Permission.objects.get_or_create(name=name, defaults={'description': desc})
        perms[name] = perm
        if created:
            print(f"Created permission: {name}")
            
    # Define roles and map permissions
    roles_mapping = {
        'Admin': list(perms.values()), # All permissions
        'Manager': [perms['quote.approve'], perms['invoice.generate'], perms['invoice.send'], perms['report.view']],
        'Sales Executive': [perms['quote.create'], perms['quote.edit'], perms['lead.view']],
        'Viewer': [perms['lead.view']], # Read-only
    }
    
    for role_name, role_perms in roles_mapping.items():
        role, created = Role.objects.get_or_create(name=role_name)
        role.permissions.set(role_perms)
        role.save()
        if created:
            print(f"Created role: {role_name}")
            
    # Assign roles to existing users based on their string role
    admin_role = Role.objects.get(name='Admin')
    manager_role = Role.objects.get(name='Manager')
    sales_role = Role.objects.get(name='Sales Executive')
    
    users = User.objects.all()
    for user in users:
        if user.role == 'admin':
            user.role_fk = admin_role
        elif user.role == 'manager':
            user.role_fk = manager_role
        elif user.role == 'sales':
            user.role_fk = sales_role
        user.save()
        print(f"Assigned role {user.role_fk.name} to user {user.username}")

if __name__ == '__main__':
    seed_rbac()
