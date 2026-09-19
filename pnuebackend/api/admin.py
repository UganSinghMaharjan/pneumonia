from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Clinic, Appointment, Scan, Prescription, MedicalHistory

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Extra Fields', {'fields': ('role', 'clinic', 'age', 'gender', 'contact_number', 'address', 'blood_group')}),
    )
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'clinic', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser')

@admin.register(Clinic)
class ClinicAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'phone', 'specialty', 'created_at')

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient', 'doctor', 'clinic', 'requested_date', 'status')
    list_filter = ('status', 'requested_date')

@admin.register(Scan)
class ScanAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient', 'doctor', 'result', 'confidence', 'created_at')
    list_filter = ('result',)

@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient', 'doctor', 'medication', 'date_issued')

@admin.register(MedicalHistory)
class MedicalHistoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient', 'doctor', 'condition', 'diagnosis_date')

