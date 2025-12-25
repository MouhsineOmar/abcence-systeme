from fastapi import APIRouter
from app.api.v1 import auth, users, groups, sessions, face, attendance

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(groups.router, prefix="/groups", tags=["groups"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
api_router.include_router(face.router, prefix="/face", tags=["face"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["attendance"])
