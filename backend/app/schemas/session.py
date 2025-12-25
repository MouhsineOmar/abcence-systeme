from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class SessionCreate(BaseModel):
    group_id: int
    teacher_id: Optional[int] = None
    start_time: datetime
    end_time: datetime

class SessionOut(BaseModel):
    id: int
    group_id: int
    teacher_id: Optional[int]
    start_time: datetime
    end_time: datetime

    class Config:
        orm_mode = True
