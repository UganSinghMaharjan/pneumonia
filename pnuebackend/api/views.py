import os
import numpy as np
from django.conf import settings
from django.contrib.auth.models import User
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

# Load model once when the app starts
MODEL_PATH = os.path.join(settings.BASE_DIR, 'model', 'pneumonia_cnn_model.h5')
try:
    model = tf.keras.models.load_model(MODEL_PATH)
    print("Model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

# Class mapping based on notebook
# Model outputs 3 classes: Normal (0), Pneumonia (1), Tuberculosis (2)
IMG_HEIGHT, IMG_WIDTH = 224, 224

class RegisterView(APIView):
    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        password = request.data.get('password')
        if email:
            email = email.strip().lower()

        if not email or not password:
            return Response({'error': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        username = email # Use email as the internal Django username

        if email == settings.DOCTOR_EMAIL:
            return Response({'error': 'Cannot register this account.'}, status=status.HTTP_403_FORBIDDEN)

        if User.objects.filter(email=email).exists() or User.objects.filter(username=username).exists():
            return Response({'error': 'Email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.create_user(username=username, email=email, password=password)
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'username': user.username,
                'email': user.email,
                'role': 'patient'
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
            # For the doctor, we generate a dummy token or create a hidden user if one doesn't exist
            # To be safe and utilize DRF token auth, we can ensure a doctor user exists.
            doctor_user, _ = User.objects.get_or_create(username=email, email=email)
            if not doctor_user.has_usable_password():
                doctor_user.set_password(password)
                doctor_user.save()
            token, _ = Token.objects.get_or_create(user=doctor_user)
            return Response({
                'token': token.key,
                'username': doctor_user.username,
                'email': doctor_user.email,
                'role': 'doctor'
            }, status=status.HTTP_200_OK)

        # Lookup user by email
        user_obj = User.objects.filter(email=email).first()
        
        # Authenticate using the actual username associated with that email
        actual_username = user_obj.username if user_obj else None
        user = authenticate(username=actual_username, password=password)
        
        if not user:
            return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        # Prevent patients from logging into the doctor account if they somehow managed to change the password
        if user.email == settings.DOCTOR_EMAIL:
            return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'username': user.username,
            'email': user.email,
            'role': 'patient'
        }, status=status.HTTP_200_OK)

class UserProfileView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        return Response({
            'username': request.user.username,
            'email': request.user.email
        }, status=status.HTTP_200_OK)

class PredictView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        if not model:
            return Response({'error': 'Model not loaded on server.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        file = request.FILES.get('image')
        if not file:
            return Response({'error': 'No image provided.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Read and process image
            image = Image.open(file).convert('RGB')
            image = image.resize((IMG_WIDTH, IMG_HEIGHT))
            img_array = np.array(image)
            img_array = img_array / 255.0  # Rescale exactly as in training
            img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension

            # Predict
            predictions = model.predict(img_array)
            
            prob_normal = float(predictions[0][0])
            prob_pneumonia = float(predictions[0][1])
            
            # Normalize probabilities between Normal and Pneumonia, ignoring Tuberculosis
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

            return Response({
                'predicted_class': predicted_class,
                'confidence': confidence,
                'probabilities': probabilities
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
