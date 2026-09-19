import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def seed_clinics(apps, schema_editor):
    Clinic = apps.get_model('api', 'Clinic')
    User = apps.get_model('api', 'User')
    Appointment = apps.get_model('api', 'Appointment')
    Scan = apps.get_model('api', 'Scan')
    MedicalHistory = apps.get_model('api', 'MedicalHistory')

    c1, _ = Clinic.objects.get_or_create(
        name="Maharjan Pulmonary Clinic",
        defaults={
            "address": "123 Lung Health Way, Pulchowk, Lalitpur",
            "phone": "+977-1-5543210",
            "specialty": "Respiratory Specialists & Asthma Center",
        }
    )
    c2, _ = Clinic.objects.get_or_create(
        name="Patna Respiratory Care Center",
        defaults={
            "address": "456 Pulmonary Avenue, Lalitpur",
            "phone": "+977-1-5521045",
            "specialty": "Pneumonia Treatment & Pulmonary Rehab",
        }
    )
    c3, _ = Clinic.objects.get_or_create(
        name="Norvic International Hospital",
        defaults={
            "address": "Thapathali, Kathmandu",
            "phone": "+977-1-4258554",
            "specialty": "Comprehensive Pulmonary & Critical Care",
        }
    )
    c4, _ = Clinic.objects.get_or_create(
        name="Bir Hospital Pulmonology Dept",
        defaults={
            "address": "Kanti Path, Kathmandu",
            "phone": "+977-1-4221119",
            "specialty": "Pneumonia Checkup & Inpatient Respiratory Care",
        }
    )

    # Assign existing doctors without a clinic to the primary clinic
    doctors = User.objects.filter(role='doctor', clinic__isnull=True)
    first_doc = User.objects.filter(role='doctor').first()
    for doc in doctors:
        doc.clinic = c1
        doc.save(update_fields=['clinic'])

    # Backfill existing appointments clinic
    if first_doc:
        for appt in Appointment.objects.filter(clinic__isnull=True):
            appt.clinic = appt.doctor.clinic or c1
            appt.save(update_fields=['clinic'])

        # Backfill existing scans doctor
        for scan in Scan.objects.filter(doctor__isnull=True):
            scan.doctor = first_doc
            scan.save(update_fields=['doctor'])

        # Backfill medical histories doctor
        for mh in MedicalHistory.objects.filter(doctor__isnull=True):
            mh.doctor = first_doc
            mh.save(update_fields=['doctor'])


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Clinic',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('address', models.TextField()),
                ('phone', models.CharField(blank=True, max_length=50, null=True)),
                ('specialty', models.CharField(blank=True, max_length=255, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.AddField(
            model_name='user',
            name='clinic',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='doctors', to='api.clinic'),
        ),
        migrations.AddField(
            model_name='appointment',
            name='clinic',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='appointments', to='api.clinic'),
        ),
        migrations.AddField(
            model_name='scan',
            name='doctor',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='doctor_scans', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='medicalhistory',
            name='doctor',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='doctor_medical_histories', to=settings.AUTH_USER_MODEL),
        ),
        migrations.RunPython(seed_clinics, reverse_code=migrations.RunPython.noop),
    ]
