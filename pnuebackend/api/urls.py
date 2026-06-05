from django.urls import path
from .views import (
    PredictView, RegisterView, LoginView, UserProfileView,
    PatientListView, ScanListView, AppointmentView, AppointmentDetailView,
    PrescriptionView, MedicalHistoryView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('user/', UserProfileView.as_view(), name='user-profile'),
    path('predict/', PredictView.as_view(), name='predict'),
    path('patients/', PatientListView.as_view(), name='patients-list'),
    path('scans/', ScanListView.as_view(), name='scans-list'),
    path('scans/<int:pk>/', ScanListView.as_view(), name='scan-detail'),
    path('appointments/', AppointmentView.as_view(), name='appointments-list'),
    path('appointments/<int:pk>/', AppointmentDetailView.as_view(), name='appointment-detail'),
    path('prescriptions/', PrescriptionView.as_view(), name='prescriptions-list'),
    path('medical-histories/', MedicalHistoryView.as_view(), name='medical-histories-list'),
]