import sys
import re

with open('d:/crm2/backend/crm_backend/settings.py', 'r') as f:
    content = f.read()

new_content = re.sub(
    r"DATABASES = \{.*?\n\}",
    '''import dj_database_url
import os

DATABASES = {
    'default': dj_database_url.config(
        default=os.environ.get('DATABASE_URL', f"sqlite:///{BASE_DIR / 'db.sqlite3'}"),
        conn_max_age=600,
        conn_health_checks=True,
    )
}''',
    content,
    flags=re.DOTALL
)

with open('d:/crm2/backend/crm_backend/settings.py', 'w') as f:
    f.write(new_content)
