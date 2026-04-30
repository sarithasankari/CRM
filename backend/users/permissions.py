from rest_framework import permissions

class IsOwnerManagerOrAdmin(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object to access it.
    Managers can access all objects owned by users in their team.
    Admins have full access.
    """
    def has_object_permission(self, request, view, obj):
        # Admin gets full access
        if request.user.role == 'admin':
            return True
            
        # Determine the user field for the object
        owner_user = getattr(obj, 'assigned_to', None)
        if owner_user is None:
            owner_user = getattr(obj, 'created_by', None)
        if owner_user is None:
            owner_user = getattr(obj, 'owner', None)
            
        # If the object does not have any ownership concept, allow access (matches get_queryset fallback)
        if owner_user is None and not any(hasattr(obj, f) for f in ['assigned_to', 'created_by', 'owner']):
            return True
            
        # Manager gets access to team records
        if request.user.role == 'manager' and request.user.team:
            return getattr(owner_user, 'team_id', None) == request.user.team_id
            
        # Sales Rep only gets access to their own records
        return owner_user == request.user
