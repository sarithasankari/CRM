import os
import datetime
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from django.conf import settings
from django.utils import timezone

def get_google_service(user):
    if not user.google_access_token:
        return None

    # Load credentials safely
    client_id = os.environ.get('GOOGLE_CLIENT_ID', getattr(settings, 'GOOGLE_CLIENT_ID', ''))
    client_secret = os.environ.get('GOOGLE_CLIENT_SECRET', getattr(settings, 'GOOGLE_CLIENT_SECRET', ''))

    creds = Credentials(
        token=user.google_access_token,
        refresh_token=user.google_refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=client_id,
        client_secret=client_secret,
    )

    if creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
            user.google_access_token = creds.token
            if creds.expiry:
                user.google_token_expiry = creds.expiry.replace(tzinfo=datetime.timezone.utc)
            user.save()
        except Exception as e:
            print(f"Failed to refresh token: {e}")
            return None

    return build('calendar', 'v3', credentials=creds)

def format_event_data(activity):
    return {
        'summary': activity.title or f"Meeting with {activity.related_to}",
        'description': activity.notes,
        'start': {
            'dateTime': activity.scheduled_at.isoformat(),
            'timeZone': 'UTC',
        },
        'end': {
            'dateTime': activity.end_time.isoformat() if activity.end_time else (activity.scheduled_at + datetime.timedelta(hours=1)).isoformat(),
            'timeZone': 'UTC',
        },
    }
