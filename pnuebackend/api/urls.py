from django.urls import path
from .views import (
    PredictView, RegisterView, LoginView, UserProfileView,
    PatientListView, ScanListView, AppointmentView, AppointmentDetailView,
    PrescriptionView, MedicalHistoryView, ClinicListView,
    AdminStatsView, AdminDoctorsView, AdminPatientsView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('user/', UserProfileView.as_view(), name='user-profile'),
    path('clinics/', ClinicListView.as_view(), name='clinics-list'),
    path('predict/', PredictView.as_view(), name='predict'),
    path('patients/', PatientListView.as_view(), name='patients-list'),
    path('scans/', ScanListView.as_view(), name='scans-list'),
    path('scans/<int:pk>/', ScanListView.as_view(), name='scan-detail'),
    path('appointments/', AppointmentView.as_view(), name='appointments-list'),
    path('appointments/<int:pk>/', AppointmentDetailView.as_view(), name='appointment-detail'),
    path('prescriptions/', PrescriptionView.as_view(), name='prescriptions-list'),
    path('medical-histories/', MedicalHistoryView.as_view(), name='medical-histories-list'),

    # Admin Endpoints
    path('admin/stats/', AdminStatsView.as_view(), name='admin-stats'),
    path('admin/doctors/', AdminDoctorsView.as_view(), name='admin-doctors-list'),
    path('admin/doctors/<int:pk>/', AdminDoctorsView.as_view(), name='admin-doctors-detail'),
    path('admin/patients/', AdminPatientsView.as_view(), name='admin-patients-list'),
    path('admin/patients/<int:pk>/', AdminPatientsView.as_view(), name='admin-patients-detail'),
]