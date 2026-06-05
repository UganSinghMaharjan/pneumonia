from django.db import models
from django.contrib.auth.models import User

class PatientProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='patient_profile')
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, null=True, blank=True)
    blood_group = models.CharField(max_length=5, null=True, blank=True)
    contact_number = models.CharField(max_length=20, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    emergency_contact = models.CharField(max_length=100, null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} Profile"

class Appointment(models.Model):
    STATUS_CHOICES = (
        ('Scheduled', 'Scheduled'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    )
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='doctor_appointments')
    date_time = models.DateTimeField()
    reason = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Scheduled')
    notes = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Appointment: {self.patient.username} on {self.date_time}"

class Prescription(models.Model):
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='prescriptions')
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='doctor_prescriptions')
    date_issued = models.DateTimeField(auto_now_add=True)
    medication = models.CharField(max_length=255)
    dosage = models.CharField(max_length=100)
    instructions = models.TextField()

    def __str__(self):
        return f"Prescription for {self.patient.username} - {self.medication}"
