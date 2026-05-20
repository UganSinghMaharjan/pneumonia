from django.urls import path
from .views import PredictView, RegisterView, LoginView, UserProfileView

urlpatterns = [
    path('predict/', PredictView.as_view(), name='predict'),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('user/', UserProfileView.as_view(), name='user-profile'),
]