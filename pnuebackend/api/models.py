from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings

class User(AbstractUser):
    ROLE_CHOICES = (
        ('doctor', 'doctor'),
        ('patient', 'patient'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='patient')
    age = models.IntegerField(null=True, blank=True)
    gender = models.CharField(max_length=10, null=True, blank=True)
    contact_number = models.CharField(max_length=20, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    blood_group = models.CharField(max_length=5, null=True, blank=True)

    def __str__(self):
        return f"{self.email} ({self.role})"

class Appointment(models.Model):
    STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('Accepted', 'Accepted'),
        ('Rejected', 'Rejected'),
        ('Completed', 'Completed'),
    )
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='doctor_appointments')
    requested_date = models.DateField()
    requested_time = models.TimeField()
    appointment_date = models.DateField(null=True, blank=True)
    appointment_time = models.TimeField(null=True, blank=True)
    reason = models.TextField()
    notes = models.TextField(null=True, blank=True)
    doctor_notes = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')

    def __str__(self):
        return f"Appointment: {self.patient.email} on {self.requested_date} - {self.status}"

class Scan(models.Model):
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='scans')
    image = models.ImageField(upload_to='scans/')
    result = models.CharField(max_length=50)  
    confidence = models.FloatField()
    doctor_remarks = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Scan: {self.patient.email} - {self.result} ({self.created_at})"

class Prescription(models.Model):
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='prescriptions')
    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='doctor_prescriptions')
    date_issued = models.DateTimeField(auto_now_add=True)
    medication = models.CharField(max_length=255)
    dosage = models.CharField(max_length=100)
    instructions = models.TextField()
    doctor_notes = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Prescription for {self.patient.email} - {self.medication}"

class MedicalHistory(models.Model):
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='medical_histories')
    condition = models.CharField(max_length=255)
    diagnosis_date = models.DateField()
    treatment = models.TextField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"MedicalHistory for {self.patient.email} - {self.condition}"
