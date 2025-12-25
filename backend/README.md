# Auto-Absence Backend (FastAPI + MySQL) — Temps réel (caméra)

## Installation (Windows)
```powershell
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

## Lancer
```powershell
uvicorn app.main:app --reload
```
Swagger: http://127.0.0.1:8000/docs

## Créer un admin
```powershell
python create_admin.py
```
Identifiants: admin@example.com / admin123

## Face recognition (optionnel)
Le backend démarre même si `face_recognition` n'est pas installé.
Mais les routes `/api/v1/face/*` demanderont l'installation.

Tenter:
```powershell
pip install face-recognition==1.3.0
```
Si ça bloque sur Windows, on bascule vers InsightFace.
