import os
import numpy as np
from django.conf import settings
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
import tensorflow as tf
from PIL import Image
import io

from .models import User, Appointment, Scan, Prescription, MedicalHistory

# Load model once when the app starts
MODEL_PATH = os.path.join(settings.BASE_DIR, 'model', 'pneumonia_cnn_model.h5')
try:
    model = tf.keras.models.load_model(MODEL_PATH)
    print("Model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

IMG_HEIGHT, IMG_WIDTH = 224, 224

class RegisterView(APIView):
    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        age = request.data.get('age')
        gender = request.data.get('gender', '')
        contact_number = request.data.get('contact_number', '')
        address = request.data.get('address', '')
        blood_group = request.data.get('blood_group', '')

        if email:
            email = email.strip().lower()

        if not email or not password:
            return Response({'error': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if email == settings.DOCTOR_EMAIL:
            return Response({'error': 'Cannot register this account.'}, status=status.HTTP_403_FORBIDDEN)

        if User.objects.filter(email=email).exists() or User.objects.filter(username=email).exists():
            return Response({'error': 'Email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                age=int(age) if age else None,
                gender=gender,
                contact_number=contact_number,
                address=address,
                blood_group=blood_group,
                role='patient'
            )
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'username': user.username,
                'email': user.email,
                'role': user.role
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LoginView(APIView):
    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        password = request.data.get('password')
        if email:
            email = email.strip().lower()

        if not email or not password:
            return Response({'error': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check for hardcoded doctor account
        if email == settings.DOCTOR_EMAIL and password == settings.DOCTOR_PASSWORD:
            doctor_user, created = User.objects.get_or_create(
                username=email,
                email=email,
                defaults={'role': 'doctor'}
            )
            if created or not doctor_user.has_usable_password():
                doctor_user.set_password(password)
                doctor_user.role = 'doctor'
                doctor_user.save()
            token, _ = Token.objects.get_or_create(user=doctor_user)
            return Response({
                'token': token.key,
                'username': doctor_user.username,
                'email': doctor_user.email,
                'role': 'doctor'
            }, status=status.HTTP_200_OK)

        # Lookup user by email
        user = User.objects.filter(email=email).first()
        if not user or not user.check_password(password):
            return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'username': user.username,
            'email': user.email,
            'role': user.role
        }, status=status.HTTP_200_OK)

class UserProfileView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'age': user.age,
            'gender': user.gender,
            'contact_number': user.contact_number,
            'address': user.address,
            'blood_group': user.blood_group
        }, status=status.HTTP_200_OK)

    def patch(self, request, *args, **kwargs):
        user = request.user
        user.first_name = request.data.get('first_name', user.first_name)
        user.last_name = request.data.get('last_name', user.last_name)
        age = request.data.get('age')
        if age is not None:
            try:
                user.age = int(age) if age != '' else None
            except ValueError:
                pass
        user.gender = request.data.get('gender', user.gender)
        user.contact_number = request.data.get('contact_number', user.contact_number)
        user.address = request.data.get('address', user.address)
        user.blood_group = request.data.get('blood_group', user.blood_group)
        user.save()
        return Response({
            'message': 'Profile updated successfully',
            'first_name': user.first_name,
            'last_name': user.last_name,
            'age': user.age,
            'gender': user.gender,
            'contact_number': user.contact_number,
            'address': user.address,
            'blood_group': user.blood_group
        }, status=status.HTTP_200_OK)

class PatientListView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        if request.user.role != 'doctor':
            return Response({'error': 'Unauthorized access.'}, status=status.HTTP_403_FORBIDDEN)
        
        patients = User.objects.filter(role='patient').order_by('email')
        data = []
        for p in patients:
            data.append({
                'id': p.id,
                'email': p.email,
                'first_name': p.first_name,
                'last_name': p.last_name,
                'age': p.age,
                'gender': p.gender,
                'contact_number': p.contact_number,
                'address': p.address,
                'blood_group': p.blood_group
            })
        return Response(data, status=status.HTTP_200_OK)

class PredictView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        if request.user.role != 'doctor':
            return Response({'error': 'Only doctors can analyze radiographs.'}, status=status.HTTP_403_FORBIDDEN)

        if not model:
            return Response({'error': 'Model not loaded on server.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        file = request.FILES.get('image')
        patient_id = request.data.get('patient_id')
        doctor_remarks = request.data.get('doctor_remarks', '')

        if not file:
            return Response({'error': 'No image provided.'}, status=status.HTTP_400_BAD_REQUEST)
        if not patient_id:
            return Response({'error': 'Please select a patient.'}, status=status.HTTP_400_BAD_REQUEST)

        # Verify patient exists
        patient_user = User.objects.filter(id=patient_id, role='patient').first()
        if not patient_user:
            return Response({'error': 'Patient not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            # Read and process image
            image = Image.open(file).convert('RGB')
            image_resized = image.resize((IMG_WIDTH, IMG_HEIGHT))
            img_array = np.array(image_resized)
            img_array = img_array / 255.0
            img_array = np.expand_dims(img_array, axis=0)

            # Predict
            predictions = model.predict(img_array)
            
            prob_normal = float(predictions[0][0])
            prob_pneumonia = float(predictions[0][1])
            
            total = prob_normal + prob_pneumonia
            if total > 0:
                prob_normal = prob_normal / total
                prob_pneumonia = prob_pneumonia / total
            else:
                prob_normal, prob_pneumonia = 0.5, 0.5

            if prob_pneumonia > prob_normal:
                predicted_class = 'Pneumonia'
                confidence = prob_pneumonia
            else:
                predicted_class = 'Normal'
                confidence = prob_normal

            probabilities = {
                'Normal': prob_normal,
                'Pneumonia': prob_pneumonia
            }

            # Create Scan record in database
            scan = Scan.objects.create(
                patient=patient_user,
                image=file,
                result=predicted_class,
                confidence=confidence,
                doctor_remarks=doctor_remarks
            )

            return Response({
                'id': scan.id,
                'patient_id': patient_user.id,
                'patient_email': patient_user.email,
                'patient_name': f"{patient_user.first_name} {patient_user.last_name}".strip() or patient_user.email,
                'predicted_class': predicted_class,
                'confidence': confidence,
                'probabilities': probabilities,
                'doctor_remarks': doctor_remarks,
                'image_url': request.build_absolute_uri(scan.image.url),
                'created_at': scan.created_at
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ScanListView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        if user.role == 'doctor':
            scans = Scan.objects.all().order_by('-created_at')
        else:
            scans = Scan.objects.filter(patient=user).order_by('-created_at')

        data = []
        for s in scans:
            data.append({
                'id': s.id,
                'patient_id': s.patient.id,
                'patient_name': f"{s.patient.first_name} {s.patient.last_name}".strip() or s.patient.email,
                'patient_email': s.patient.email,
                'result': s.result,
                'confidence': s.confidence,
                'doctor_remarks': s.doctor_remarks,
                'image_url': request.build_absolute_uri(s.image.url) if s.image else None,
                'created_at': s.created_at
            })
        return Response(data, status=status.HTTP_200_OK)

    def patch(self, request, pk, *args, **kwargs):
        if request.user.role != 'doctor':
            return Response({'error': 'Unauthorized access.'}, status=status.HTTP_403_FORBIDDEN)
        scan = Scan.objects.filter(id=pk).first()
        if not scan:
            return Response({'error': 'Scan record not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        scan.doctor_remarks = request.data.get('doctor_remarks', scan.doctor_remarks)
        scan.save()
        return Response({
            'id': scan.id,
            'doctor_remarks': scan.doctor_remarks,
            'message': 'Remarks updated successfully'
        }, status=status.HTTP_200_OK)

class AppointmentView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        if user.role == 'doctor':
            appointments = Appointment.objects.all().order_by('-requested_date', '-requested_time')
        else:
            appointments = Appointment.objects.filter(patient=user).order_by('-requested_date', '-requested_time')

        data = []
        for a in appointments:
            data.append({
                'id': a.id,
                'patient_id': a.patient.id,
                'patient_name': f"{a.patient.first_name} {a.patient.last_name}".strip() or a.patient.email,
                'patient_email': a.patient.email,
                'doctor_id': a.doctor.id,
                'doctor_email': a.doctor.email,
                'requested_date': a.requested_date,
                'requested_time': a.requested_time.strftime('%H:%M') if a.requested_time else None,
                'appointment_date': a.appointment_date,
                'appointment_time': a.appointment_time.strftime('%H:%M') if a.appointment_time else None,
                'reason': a.reason,
                'notes': a.notes,
                'doctor_notes': a.doctor_notes,
                'status': a.status
            })
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        user = request.user
        if user.role != 'patient':
            return Response({'error': 'Only patients can request appointments.'}, status=status.HTTP_403_FORBIDDEN)

        requested_date = request.data.get('requested_date')
        requested_time = request.data.get('requested_time')
        reason = request.data.get('reason')
        notes = request.data.get('notes', '')

        if not requested_date or not requested_time or not reason:
            return Response({'error': 'Date, time, and reason are required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Get or create the hardcoded doctor
        doctor = User.objects.filter(email='dr_maharjans@gmail.com').first()
        if not doctor:
            doctor = User.objects.create_user(
                username='dr_maharjans@gmail.com',
                email='dr_maharjans@gmail.com',
                password=settings.DOCTOR_PASSWORD,
                role='doctor'
            )

        try:
            appointment = Appointment.objects.create(
                patient=user,
                doctor=doctor,
                requested_date=requested_date,
                requested_time=requested_time,
                reason=reason,
                notes=notes,
                status='Pending'
            )
            return Response({
                'id': appointment.id,
                'status': appointment.status,
                'message': 'Appointment request submitted successfully'
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AppointmentDetailView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk, *args, **kwargs):
        if request.user.role != 'doctor':
            return Response({'error': 'Unauthorized access.'}, status=status.HTTP_403_FORBIDDEN)

        appointment = Appointment.objects.filter(id=pk).first()
        if not appointment:
            return Response({'error': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')  # 'accept', 'reject', 'complete'
        doctor_notes = request.data.get('doctor_notes', '')

        if action == 'accept':
            appointment_date = request.data.get('appointment_date')
            appointment_time = request.data.get('appointment_time')
            if not appointment_date or not appointment_time:
                return Response({'error': 'Appointment date and time are required for approval.'}, status=status.HTTP_400_BAD_REQUEST)
            appointment.appointment_date = appointment_date
            appointment.appointment_time = appointment_time
            appointment.doctor_notes = doctor_notes
            appointment.status = 'Accepted'
        elif action == 'reject':
            appointment.doctor_notes = doctor_notes
            appointment.status = 'Rejected'
        elif action == 'complete':
            appointment.status = 'Completed'
            appointment.doctor_notes = doctor_notes or appointment.doctor_notes
        else:
            return Response({'error': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)

        appointment.save()
        return Response({
            'id': appointment.id,
            'status': appointment.status,
            'message': f'Appointment updated to {appointment.status}'
        }, status=status.HTTP_200_OK)

class PrescriptionView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        patient_id = request.query_params.get('patient_id')

        if user.role == 'doctor':
            if patient_id:
                prescriptions = Prescription.objects.filter(patient_id=patient_id).order_by('-date_issued')
            else:
                prescriptions = Prescription.objects.all().order_by('-date_issued')
        else:
            prescriptions = Prescription.objects.filter(patient=user).order_by('-date_issued')

        data = []
        for p in prescriptions:
            data.append({
                'id': p.id,
                'patient_id': p.patient.id,
                'patient_name': f"{p.patient.first_name} {p.patient.last_name}".strip() or p.patient.email,
                'medication': p.medication,
                'dosage': p.dosage,
                'instructions': p.instructions,
                'doctor_notes': p.doctor_notes,
                'date_issued': p.date_issued
            })
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        if request.user.role != 'doctor':
            return Response({'error': 'Only doctors can write prescriptions.'}, status=status.HTTP_403_FORBIDDEN)

        patient_id = request.data.get('patient_id')
        medication = request.data.get('medication')
        dosage = request.data.get('dosage')
        instructions = request.data.get('instructions')
        doctor_notes = request.data.get('doctor_notes', '')

        if not patient_id or not medication or not dosage or not instructions:
            return Response({'error': 'Patient, medication, dosage, and instructions are required.'}, status=status.HTTP_400_BAD_REQUEST)

        patient = User.objects.filter(id=patient_id, role='patient').first()
        if not patient:
            return Response({'error': 'Patient not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            prescription = Prescription.objects.create(
                patient=patient,
                doctor=request.user,
                medication=medication,
                dosage=dosage,
                instructions=instructions,
                doctor_notes=doctor_notes
            )
            return Response({
                'id': prescription.id,
                'message': 'Prescription issued successfully'
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MedicalHistoryView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        patient_id = request.query_params.get('patient_id')

        if user.role == 'doctor':
            if patient_id:
                history = MedicalHistory.objects.filter(patient_id=patient_id).order_by('-diagnosis_date')
            else:
                history = MedicalHistory.objects.all().order_by('-diagnosis_date')
        else:
            history = MedicalHistory.objects.filter(patient=user).order_by('-diagnosis_date')

        data = []
        for h in history:
            data.append({
                'id': h.id,
                'patient_id': h.patient.id,
                'patient_name': f"{h.patient.first_name} {h.patient.last_name}".strip() or h.patient.email,
                'condition': h.condition,
                'diagnosis_date': h.diagnosis_date,
                'treatment': h.treatment,
                'notes': h.notes,
                'created_at': h.created_at
            })
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        if request.user.role != 'doctor':
            return Response({'error': 'Only doctors can add medical history.'}, status=status.HTTP_403_FORBIDDEN)

        patient_id = request.data.get('patient_id')
        condition = request.data.get('condition')
        diagnosis_date = request.data.get('diagnosis_date')
        treatment = request.data.get('treatment', '')
        notes = request.data.get('notes', '')

        if not patient_id or not condition or not diagnosis_date:
            return Response({'error': 'Patient, condition, and diagnosis date are required.'}, status=status.HTTP_400_BAD_REQUEST)

        patient = User.objects.filter(id=patient_id, role='patient').first()
        if not patient:
            return Response({'error': 'Patient not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            history = MedicalHistory.objects.create(
                patient=patient,
                condition=condition,
                diagnosis_date=diagnosis_date,
                treatment=treatment,
                notes=notes
            )
            return Response({
                'id': history.id,
                'message': 'Medical history record added successfully'
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
