from rest_framework import permissions
from users.permissions import IsOwnerManagerOrAdmin

class TeamOwnedViewSetMixin:
    """
    Mixin to filter querysets based on user roles and apply object-level permissions.
    """
    permission_classes = [permissions.IsAuthenticated, IsOwnerManagerOrAdmin]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        if not user.is_authenticated:
            return queryset.none()
            
        if user.role == 'admin':
            return queryset
            
        # Determine the user field used by the model
        model = queryset.model
        user_field = None
        for field in ['assigned_to', 'created_by', 'owner']:
            # We check if the field exists on the model
            if hasattr(model, field) or field in [f.name for f in model._meta.get_fields()]:
                user_field = field
                break
                
        if not user_field:
            # If the model doesn't have an owner field, fallback to default behavior (or maybe restrict it)
            return queryset
            
        if user.role == 'manager' and user.team:
            return queryset.filter(**{f"{user_field}__team": user.team})
            
        # Sales rep gets only their own
        return queryset.filter(**{user_field: user})

    def perform_create(self, serializer):
        user = self.request.user
        if not user.is_authenticated:
            serializer.save()
            return
            
        model = serializer.Meta.model
        user_field = None
        for field in ['assigned_to', 'created_by', 'owner']:
            if hasattr(model, field) or field in [f.name for f in model._meta.get_fields()]:
                user_field = field
                break
                
        if user_field and not serializer.validated_data.get(user_field):
            serializer.save(**{user_field: user})
        else:
            serializer.save()
