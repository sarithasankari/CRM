from rest_framework import generics, viewsets, mixins, views, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model, update_session_auth_hash
from .serializers import RegisterSerializer, UserSerializer, CompanyProfileSerializer
from .models import CompanyProfile

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

class UserDetailView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

class UserListView(generics.ListAPIView):
    """GET /api/users/ — list all users (admin/manager use for assignment UI)."""
    queryset = User.objects.all().order_by('id')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['role', 'team']
    search_fields = ['username', 'email', 'first_name', 'last_name']

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
        
        return Response({'success': 'Password updated successfully!'})
