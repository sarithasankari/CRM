from rest_framework import permissions


class RoleBasedAccessPermission(permissions.BasePermission):
    """
    Production-grade, owner-field-first RBAC permission.

    Resolution order for 'owner' of an object:
      1. obj.owner        — Contacts, Deals (primary ownership field)
      2. obj.assigned_to  — Leads, Tasks (assignment-based ownership)

    Rules:
      Admin   → full access to everything
      Manager → access to records where owner belongs to same team
      Sales   → access ONLY to records they personally own/are-assigned-to

    STRICT: if no owner can be resolved → access DENIED (no fallback leaks).
    """

    def has_permission(self, request, view):
        """Gate: user must be authenticated to reach any endpoint."""
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user

        # Admins have unrestricted access
        if user.role == 'admin':
            return True

        # ── Resolve the authoritative owner ──────────────────────────────
        owner = self._resolve_owner(obj)

        # STRICT: no owner resolved → deny. Never expose orphan records.
        if owner is None:
            return False

        # ── Manager: same-team access ─────────────────────────────────────
        if user.role == 'manager':
            if not user.team:
                return False
            return bool(owner.team and owner.team == user.team)

        # ── Sales: personal records only ──────────────────────────────────
        if user.role == 'sales':
            return owner == user

        return False

    # ── Internal helper ───────────────────────────────────────────────────
    @staticmethod
    def _resolve_owner(obj):
        """
        Return the User who owns this object, using the most direct field.
        Priority: .owner → .assigned_to → None (never a chain of relations).
        """
        # Direct ownership field (Contact, Deal)
        if hasattr(obj, 'owner') and obj.owner is not None:
            return obj.owner

        # Assignment-based field (Lead, Task)
        if hasattr(obj, 'assigned_to') and obj.assigned_to is not None:
            return obj.assigned_to

        return None

def has_perm(perm_name):
    class CustomPermission(permissions.BasePermission):
        def has_permission(self, request, view):
            if not request.user or not request.user.is_authenticated:
                return False
            if not request.user.role_fk:
                return False
            return request.user.role_fk.permissions.filter(name=perm_name).exists()
    return CustomPermission
