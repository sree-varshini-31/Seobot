import os
import django
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bot_backend.settings')
django.setup()

from django.contrib.auth.models import User

# Delete if exists
User.objects.filter(username='testuser123').delete()

# Create user WITHOUT a profile
user = User.objects.create_user(username='testuser123', email='test@test.com', password='Password123!')

# We skip creating the profile to intentionally mimic the state where profile doesn't exist
# We test the endpoint via django test client
from django.test import Client

client = Client()
response = client.post('/api/auth/login/', {'username': 'testuser123', 'password': 'Password123!'}, content_type='application/json')
print(f"Login Response: {response.status_code}")
print(f"Login Data: {response.json()}")
