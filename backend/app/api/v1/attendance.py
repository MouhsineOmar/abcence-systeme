import io
import pandas as pd
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional

from app.api.deps import get_db, require_teacher_or_admin
from app.models.attendance import Attendance
from app.models.session import Session as SessionModel
from app.models.user import User, RoleEnum
from app.models.user_group import UserGroup

router = APIRouter()

@router.get("/export")
def export_excel(
    db: Session = Depends(get_db),
    _: User = Depends(require_teacher_or_admin),
    group_id: Optional[int] = Query(None),
    session_id: Optional[int] = Query(None),
):
    if not session_id and not group_id:
        raise HTTPException(status_code=400, detail="session_id ou group_id requis")

    sessions = (
        db.query(SessionModel).filter(SessionModel.id == session_id).all()
        if session_id
        else db.query(SessionModel).filter(SessionModel.group_id == group_id).all()
    )
    if not sessions:
        raise HTTPException(status_code=404, detail="Aucune séance trouvée")

    rows = []
    for sess in sessions:
        student_ids = [ug.user_id for ug in db.query(UserGroup).filter(UserGroup.group_id == sess.group_id).all()]
        students = (
            db.query(User).filter(User.id.in_(student_ids), User.role == RoleEnum.STUDENT).all()
            if student_ids else []
        )
        present_ids = set([a.user_id for a in db.query(Attendance).filter(Attendance.session_id == sess.id).all()])

        for st in students:
            rows.append({
                "Session ID": sess.id,
                "Group ID": sess.group_id,
                "Start": sess.start_time,
                "End": sess.end_time,
                "Student ID": st.id,
                "First name": st.first_name,
                "Last name": st.last_name,
                "Email": st.email,
                "Status": "PRESENT" if st.id in present_ids else "ABSENT",
            })

    df = pd.DataFrame(rows)
    out = io.BytesIO()
    with pd.ExcelWriter(out, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Attendance")
    out.seek(0)

    fname = f"attendance_{'session_'+str(session_id) if session_id else 'group_'+str(group_id)}.xlsx"
    return StreamingResponse(
        out,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={fname}"},
    )
