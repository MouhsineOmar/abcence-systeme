from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.api.deps import get_db, require_admin
from app.models.group import Group
from app.models.user import User, RoleEnum
from app.models.user_group import UserGroup
from app.schemas.group import GroupCreate, GroupOut

router = APIRouter()

@router.get("/", response_model=List[GroupOut])
def list_groups(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(Group).all()

@router.post("/", response_model=GroupOut)
def create_group(payload: GroupCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    g = Group(name=payload.name)
    db.add(g)
    db.commit()
    db.refresh(g)
    return g

@router.post("/{group_id}/add-student/{student_id}")
def add_student(group_id: int, student_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    if not db.query(Group).filter(Group.id == group_id).first():
        raise HTTPException(status_code=404, detail="Group not found")
    if not db.query(User).filter(User.id == student_id, User.role == RoleEnum.STUDENT).first():
        raise HTTPException(status_code=404, detail="Student not found")
    if db.query(UserGroup).filter(UserGroup.group_id == group_id, UserGroup.user_id == student_id).first():
        return {"message": "Already in group"}
    db.add(UserGroup(group_id=group_id, user_id=student_id))
    db.commit()
    return {"message": "Student added"}
