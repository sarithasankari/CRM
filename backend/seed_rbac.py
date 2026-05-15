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
        ('ticket.view', 'Can view support tickets'),
        ('ticket.edit', 'Can edit support tickets'),
        ('task.view', 'Can view tasks'),
        ('task.edit', 'Can edit tasks'),
        ('deal.view', 'Can view deals'),
        ('deal.edit', 'Can edit deals'),
    ]
    
    perms = {}
    for name, desc in permissions_list:
        perm, created = Permission.objects.get_or_create(name=name, defaults={'description': desc})
        perms[name] = perm
        if created:
            print(f"Created permission: {name}")
            
    # Define roles and map permissions
    roles_mapping = {
        'System Administrator': list(perms.values()),
        'Sales Manager': [perms['quote.approve'], perms['report.view'], perms['deal.view']],
        'Sales Representative': [perms['lead.view'], perms['lead.edit'], perms['deal.view'], perms['deal.edit'], perms['task.view'], perms['task.edit']],
        'Support Agent': [perms['ticket.view'], perms['ticket.edit']],
        'Finance Manager': [perms['invoice.generate'], perms['invoice.send'], perms['invoice.mark_paid']],
        'Executive': [perms['report.view'], perms['lead.view'], perms['deal.view']],
    }
    
    for role_name, role_perms in roles_mapping.items():
        role, created = Role.objects.get_or_create(name=role_name)
        role.permissions.set(role_perms)
        role.save()
        if created:
            print(f"Created role: {role_name}")
            
    # Create sample users
    sample_users = [
        ('admin@crm.com', 'admin', 'System Administrator'),
        ('manager@crm.com', 'manager', 'Sales Manager'),
        ('sales@crm.com', 'sales', 'Sales Representative'),
        ('support@crm.com', 'support', 'Support Agent'),
        ('finance@crm.com', 'finance', 'Finance Manager'),
        ('executive@crm.com', 'executive', 'Executive'),
    ]
    
    for email, password, role_name in sample_users:
        username = email.split('@')[0]
        user, created = User.objects.get_or_create(username=username, defaults={
            'email': email,
            'first_name': username.capitalize(),
            'last_name': 'Demo',
            'role': role_name.lower().replace(' ', '_'),
        })
        if created:
            user.set_password(password)
            print(f"Created sample user: {username}")
        
        user.email = email
        user.role_fk = Role.objects.get(name=role_name)
        user.save()
        print(f"Updated user {username} with role {role_name}")

if __name__ == '__main__':
    seed_rbac()
