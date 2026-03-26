from django.urls import path
from .views import keyword_list, keyword_suggestions

urlpatterns = [
    path('keywords/', keyword_list, name='keyword-list'),
    path('keyword-suggestions/', keyword_suggestions),
]