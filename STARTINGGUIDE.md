# 🫁 Pneumonix AI — Starting Guide

A full-stack chest X-ray diagnostic application.  
**Backend**: Django 6 (Python 3.12) · **Frontend**: Next.js 16 (Node 22)

---

## Project Structure

```
pneumonia/
├── pnuebackend/      # Django REST API + AI model
│   ├── venv/         # Python virtual environment
│   ├── api/          # App views, models, URLs
│   ├── core/         # Django settings & root URLs
│   ├── model/        # pneumonia_cnn_model.h5
│   └── manage.py
└── pnuefrontend/     # Next.js frontend
    ├── src/app/      # Pages & components
    └── next.config.ts
```

---

## Prerequisites

Make sure you have these installed before first-time setup:

| Tool | Minimum Version | Check with |
|------|----------------|------------|
| Python | 3.10+ | `python3 --version` |
| Node.js | 18+ | `node --version` |
| npm | 8+ | `npm --version` |
| pip | any | `pip --version` |

---

## First-Time Setup

### 1 — Backend (Django)

```bash
# Navigate to backend directory
cd pnuebackend

# Create Python virtual environment (only needed once)
python3 -m venv venv

# Activate the virtual environment
source venv/bin/activate        # Linux / macOS
# venv\Scripts\activate         # Windows

# Install all Python dependencies
pip install -r requirements.txt

# Apply database migrations (only needed once, or after model changes)
python manage.py migrate

# (Optional) Create a Django admin superuser
python manage.py createsuperuser
```

### 2 — Frontend (Next.js)

```bash
# Navigate to frontend directory
cd pnuefrontend

# Install Node.js dependencies (only needed once)
npm install
```

---

## Running the App (Daily Use)

You need **two terminals** running simultaneously.

### Terminal 1 — Start the Django backend

```bash
cd pnuebackend
source venv/bin/activate
python manage.py runserver 0.0.0.0:8000
```

> Backend will be available at:
> - Local:   http://localhost:8000
> - Network: http://192.168.1.77:8000

### Terminal 2 — Start the Next.js frontend

```bash
cd pnuefrontend
npm run dev
```

> Frontend will be available at:
> - Local:   http://localhost:3000
> - Network: http://192.168.1.77:3000  <-- open this on other devices

---

## Accessing the App

| Role | URL | Default Credentials |
|------|-----|---------------------|
| Doctor | http://192.168.1.77:3000/login | dr_maharjans@gmail.com / doctor@123 |
| Patient | http://192.168.1.77:3000/login | Register a new account |
| Django Admin | http://localhost:8000/admin | Superuser account |

From another computer on the same network, use the Network URL (192.168.1.77:3000).
Replace 192.168.1.77 with your machine's actual local IP if it changes.

---

## Stopping the Servers

Press Ctrl + C in each terminal to stop the server.

If a port is already in use when restarting:

```bash
# Kill whatever is using port 8000 (Django)
fuser -k 8000/tcp

# Kill whatever is using port 3000 (Next.js)
fuser -k 3000/tcp
```

---

## Useful Django Commands

```bash
# Always activate venv first:
source venv/bin/activate

# Run database migrations after model changes
python manage.py migrate

# Create new migrations after editing models.py
python manage.py makemigrations

# Open the Django shell (Python REPL with Django context)
python manage.py shell

# Run tests
python manage.py test
```

---

## Useful Frontend Commands

```bash
# Start development server (with network access)
npm run dev

# Type-check the project without building
npx tsc --noEmit

# Lint the codebase
npm run lint

# Build for production
npm run build

# Start production server (after build)
npm run start
```

---

## How the Proxy Works

All API calls from the browser go through Next.js — no direct browser connection to Django is needed.

```
Browser  →  http://192.168.1.77:3000/backend/login
         →  Next.js server (proxy, server-side)
         →  http://localhost:8000/api/login/
         →  Django responds
```

This means:
- Only port 3000 needs to be accessible from other computers
- Port 8000 (Django) does NOT need to be exposed externally
- Media files (X-ray images) are also proxied via /media/*

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Error: That port is already in use | Run `fuser -k 8000/tcp` or `fuser -k 3000/tcp` |
| ModuleNotFoundError in Django | Make sure venv is activated: `source venv/bin/activate` |
| npm: command not found | Install Node.js from https://nodejs.org |
| Login returns 404 | Ensure Django is running on port 8000 |
| X-ray images not loading | Ensure Django is running (media files are proxied through Next.js) |
| WebSocket HMR failed in browser | Normal warning when accessing via network IP — does not affect functionality |

---

## Environment Info

- Python: 3.12.3
- Node.js: 22.x
- Django: 6.0.4
- Next.js: 16.2.4
- Database: SQLite (pnuebackend/db.sqlite3)
- AI Model: TensorFlow CNN (pnuebackend/model/pneumonia_cnn_model.h5)
