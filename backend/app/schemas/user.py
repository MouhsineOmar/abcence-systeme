from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.user import RoleEnum

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    role: RoleEnum
    password: Optional[str] = None

class UserOut(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    role: RoleEnum
    is_active: bool

    class Config:
        orm_mode = True
