from datetime import datetime, timedelta

from app.db.session import SessionLocal, Base, engine
from app.core.security import hash_password

from app.models.user import User, RoleEnum
from app.models.group import Group
from app.models.user_group import UserGroup
from app.models.session import Session as SessionModel
from app.models.attendance import Attendance, AttendanceStatus


def get_or_create_user(db, *, email, first_name, last_name, role, password=None):
    u = db.query(User).filter(User.email == email).first()
    if u:
        return u

    u = User(
        first_name=first_name,
        last_name=last_name,
        email=email,
        role=role,
        is_active=True,
        hashed_password=hash_password(password) if password else None,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


def get_or_create_group(db, *, name):
    g = db.query(Group).filter(Group.name == name).first()
    if g:
        return g
    g = Group(name=name)
    db.add(g)
    db.commit()
    db.refresh(g)
    return g


def ensure_student_in_group(db, *, student_id, group_id):
    link = (
        db.query(UserGroup)
        .filter(UserGroup.user_id == student_id, UserGroup.group_id == group_id)
        .first()
    )
    if link:
        return
    db.add(UserGroup(user_id=student_id, group_id=group_id))
    db.commit()


def main():
    # crée les tables si base vide
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 1) Admin
        admin = get_or_create_user(
            db,
            email="admin@example.com",
            first_name="Admin",
            last_name="Super",
            role=RoleEnum.ADMIN,
            password="admin123",
        )

        # 2) Prof
        teacher = get_or_create_user(
            db,
            email="teacher@example.com",
            first_name="Prof",
            last_name="Math",
            role=RoleEnum.TEACHER,
            password="teacher123",
        )

        # 3) Étudiants
        students = []
        for i in range(1, 6):
            st = get_or_create_user(
                db,
                email=f"student{i}@example.com",
                first_name=f"Student{i}",
                last_name="ClassA",
                role=RoleEnum.STUDENT,
                password=None,  # pas obligatoire
            )
            students.append(st)

        # 4) Groupe
        group = get_or_create_group(db, name="GI1-A")

        # 5) Associer étudiants au groupe (user_groups)
        for st in students:
            ensure_student_in_group(db, student_id=st.id, group_id=group.id)

        # 6) Créer une séance
        start = datetime.utcnow()
        end = start + timedelta(hours=1)
        sess = SessionModel(group_id=group.id, teacher_id=teacher.id, start_time=start, end_time=end)
        db.add(sess)
        db.commit()
        db.refresh(sess)

        # 7) Marquer 2 étudiants comme PRESENT (attendance)
        for st in students[:2]:
            exists = db.query(Attendance).filter(
                Attendance.session_id == sess.id,
                Attendance.user_id == st.id
            ).first()
            if not exists:
                db.add(
                    Attendance(
                        session_id=sess.id,
                        user_id=st.id,
                        status=AttendanceStatus.PRESENT,
                        timestamp=datetime.utcnow(),
                    )
                )
        db.commit()

        print("✅ Seed terminé.")
        print(f"Admin: {admin.email} / admin123 (id={admin.id})")
        print(f"Teacher: {teacher.email} / teacher123 (id={teacher.id})")
        print(f"Group: {group.name} (id={group.id})")
        print(f"Session: id={sess.id} group_id={sess.group_id} teacher_id={sess.teacher_id}")
        print("Students:", [(s.id, s.email) for s in students])

    finally:
        db.close()


if __name__ == "__main__":
    main()
