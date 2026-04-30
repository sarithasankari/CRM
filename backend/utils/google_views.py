import datetime
import os
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from google_auth_oauthlib.flow import Flow

SCOPES = ['https://www.googleapis.com/auth/calendar.events']

def get_client_config():
    client_id = os.environ.get('GOOGLE_CLIENT_ID', getattr(settings, 'GOOGLE_CLIENT_ID', ''))
    client_secret = os.environ.get('GOOGLE_CLIENT_SECRET', getattr(settings, 'GOOGLE_CLIENT_SECRET', ''))
    return {
        "web": {
            "client_id": client_id,
            "client_secret": client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    }

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_auth_url(request):
    redirect_uri = request.GET.get('redirect_uri', 'postmessage')
    flow = Flow.from_client_config(
        get_client_config(),
        scopes=SCOPES,
        redirect_uri=redirect_uri
    )
    auth_url, state = flow.authorization_url(access_type='offline', include_granted_scopes='true', prompt='consent')
    return Response({'url': auth_url})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_token(request):
    code = request.data.get('code')
    redirect_uri = request.data.get('redirect_uri', 'postmessage')
    flow = Flow.from_client_config(
        get_client_config(),
        scopes=SCOPES,
        redirect_uri=redirect_uri
    )
    flow.fetch_token(code=code)
    creds = flow.credentials
    
    user = request.user
    user.google_access_token = creds.token
    if creds.refresh_token:
        user.google_refresh_token = creds.refresh_token
    if creds.expiry:
        user.google_token_expiry = creds.expiry.replace(tzinfo=datetime.timezone.utc)
    user.save()
    
    return Response({'status': 'connected'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def status(request):
    is_connected = bool(request.user.google_access_token)
    return Response({'connected': is_connected})
