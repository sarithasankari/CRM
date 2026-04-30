from rest_framework import permissions

class RoleBasedAccessPermission(permissions.BasePermission):
    """
    Admin: Full access.
    Manager: Access to records assigned to users in their team.
    Sales Rep: Access only to their own records.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
            
        # Determine the owner of the object depending on the model
        owner = None
        if hasattr(obj, 'assigned_to'):
            owner = obj.assigned_to
        elif hasattr(obj, 'contact') and hasattr(obj.contact, 'linked_lead') and obj.contact.linked_lead:
            owner = obj.contact.linked_lead.assigned_to

        if not owner:
            # If no owner exists, allow or deny?
            # Let's deny by default unless Admin
            return False

        if request.user.role == 'manager':
            # Manager has access if they belong to the same team as the owner
            return bool(request.user.team and request.user.team == owner.team)

        if request.user.role == 'sales':
            # Sales Rep only accesses their own records
            return owner == request.user

        return False
