# Pneumonia Detection Backend

This is a Django-based backend for the Pneumonia Detection project. It uses a CNN model to predict whether a chest X-ray indicates Pneumonia or is Normal.

## Setup Instructions

1. **Virtual Environment**:
   Ensure you have a virtual environment set up. If not, create one:
   ```powershell
   python -m venv venv
   ```

2. **Activate Virtual Environment**:
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```

3. **Install Dependencies**:
   ```powershell
   pip install -r requirements.txt
   ```

4. **Model File**:
   Place your trained model file `pneumonia_cnn_model.h5` inside the `model/` directory:
   `pnuebackend/model/pneumonia_cnn_model.h5`

5. **Run Migrations**:
   ```powershell
   python manage.py migrate
   ```

6. **Start the Server**:
   ```powershell
   python manage.py runserver 8001
   ```

## API Endpoints

- **POST `/api/predict/`**: Upload an image to get a prediction.
  - Body: `multipart/form-data` with key `image`.
