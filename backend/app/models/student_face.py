from sqlalchemy import Column, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.session import Base

class StudentFace(Base):
    __tablename__ = "student_faces"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    encoding = Column(Text, nullable=False)

    user = relationship("User", back_populates="face_encoding")
