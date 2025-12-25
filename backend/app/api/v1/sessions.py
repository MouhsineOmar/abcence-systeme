from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.api.deps import get_db, require_admin
from app.models.session import Session as SessionModel
from app.models.group import Group
from app.schemas.session import SessionCreate, SessionOut
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[SessionOut])
def list_sessions(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(SessionModel).order_by(SessionModel.start_time.desc()).all()

@router.post("/", response_model=SessionOut)
def create_session(payload: SessionCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    if not db.query(Group).filter(Group.id == payload.group_id).first():
        raise HTTPException(status_code=404, detail="Group not found")
    s = SessionModel(
        group_id=payload.group_id,
        teacher_id=payload.teacher_id,
        start_time=payload.start_time,
        end_time=payload.end_time,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return s
