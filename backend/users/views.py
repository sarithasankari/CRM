from rest_framework import generics, viewsets, mixins, views, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth import get_user_model, update_session_auth_hash
from django.utils import timezone
from .serializers import RegisterSerializer, UserSerializer, CompanyProfileSerializer, RoleSerializer, LoginHistorySerializer, UserSessionSerializer, AuditLogSerializer, CustomTokenObtainPairSerializer
from .models import CompanyProfile, Role, LoginHistory, UserSession, AuditLog
from .permissions import IsAdmin, IsAdminOrManager
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from django_user_agents.utils import get_user_agent

User = get_user_model()

from rest_framework_simplejwt.views import TokenObtainPairView

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

class UserDetailView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        instance = self.get_object()
        old_value = {
            'username': instance.username,
            'email': instance.email,
            'first_name': instance.first_name,
            'last_name': instance.last_name,
            'notifications': instance.notifications
        }
        
        super().perform_update(serializer)
        
        instance.refresh_from_db()
        new_value = {
            'username': instance.username,
            'email': instance.email,
            'first_name': instance.first_name,
            'last_name': instance.last_name,
            'notifications': instance.notifications
        }
        
        user_agent = get_user_agent(self.request)
        device = "Mobile" if user_agent.is_mobile else "Tablet" if user_agent.is_tablet else "PC" if user_agent.is_pc else "Bot" if user_agent.is_bot else "Unknown"
        
        AuditLog.objects.create(
            user=self.request.user,
            action_type='PROFILE_UPDATED',
            module='users',
            old_value=str(old_value),
            new_value=str(new_value),
            ip_address=self.request.META.get('REMOTE_ADDR'),
            device=device
        )

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('id')
    serializer_class = UserSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAdminOrManager()]
        return [IsAdmin()]

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all().order_by('id')
    serializer_class = RoleSerializer
    permission_classes = [IsAdmin]

class LoginHistoryView(generics.ListAPIView):
    serializer_class = LoginHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return LoginHistory.objects.filter(user=self.request.user).order_by('-timestamp')

class CompanyProfileView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, created = CompanyProfile.objects.get_or_create(id=1)
        serializer = CompanyProfileSerializer(profile)
        return Response(serializer.data)

    def put(self, request):
        profile, created = CompanyProfile.objects.get_or_create(id=1)
        serializer = CompanyProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')

        if not user.check_password(current_password):
            return Response({'error': 'Incorrect current password.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        
        update_session_auth_hash(request, user)
        
        user_agent = get_user_agent(request)
        device = "Mobile" if user_agent.is_mobile else "Tablet" if user_agent.is_tablet else "PC" if user_agent.is_pc else "Bot" if user_agent.is_bot else "Unknown"
        
        AuditLog.objects.create(
            user=request.user,
            action_type='PASSWORD_CHANGED',
            module='auth',
            ip_address=request.META.get('REMOTE_ADDR'),
            device=device
        )
        
        return Response({'success': 'Password updated successfully!'})


class UserSessionViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSessionSerializer

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return UserSession.objects.all().order_by('-login_time')
        return UserSession.objects.filter(user=self.request.user).order_by('-login_time')

    @action(detail=True, methods=['post'], url_path='logout')
    def logout_session(self, request, pk=None):
        session = self.get_object()
        if session.user != request.user and request.user.role != 'admin':
            return Response({'error': 'You do not have permission to terminate this session.'}, status=status.HTTP_403_FORBIDDEN)
        
        session.is_active = False
        session.logout_time = timezone.now()
        session.save()

        if session.refresh_jti:
            try:
                outstanding_token = OutstandingToken.objects.get(jti=session.refresh_jti)
                BlacklistedToken.objects.get_or_create(token=outstanding_token)
            except OutstandingToken.DoesNotExist:
                pass

        return Response({'success': 'Session terminated successfully.'})

    @action(detail=False, methods=['post'], url_path='logout-all')
    def logout_all(self, request):
        current_jti = None
        if hasattr(request, 'auth') and hasattr(request.auth, 'get'):
            current_jti = request.auth.get('jti')
            
        sessions = UserSession.objects.filter(user=request.user, is_active=True)
        if current_jti:
            sessions = sessions.exclude(jti=current_jti)
            
        for session in sessions:
            session.is_active = False
            session.logout_time = timezone.now()
            session.save()
            
            if session.refresh_jti:
                try:
                    outstanding_token = OutstandingToken.objects.get(jti=session.refresh_jti)
                    BlacklistedToken.objects.get_or_create(token=outstanding_token)
                except OutstandingToken.DoesNotExist:
                    pass

        return Response({'success': 'All other sessions terminated successfully.'})


class AuditLogView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return AuditLog.objects.all().order_by('-timestamp')
        return AuditLog.objects.filter(user=self.request.user).order_by('-timestamp')
