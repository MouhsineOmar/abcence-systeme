# Auto-Absence Frontend (React + Tailwind) — Modern UI

## Setup
```bash
npm install
```

Create `.env` from `.env.example`:
```bash
cp .env.example .env
```

Run:
```bash
npm run dev
```

## Backend endpoints used
- POST /auth/login (x-www-form-urlencoded) -> JWT token
- Admin:
  - GET/POST /users/
  - GET/POST /groups/
  - POST /groups/{group_id}/add-student/{student_id}
  - GET/POST /sessions/
- Face:
  - POST /face/mark-attendance/{session_id} (multipart file)
- Export:
  - GET /attendance/export?session_id=... OR group_id=... (blob download)
