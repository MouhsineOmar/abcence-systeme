from app.db.session import SessionLocal, Base, engine
from app.models.user import User, RoleEnum
from app.core.security import hash_password

def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        email = "admin@example.com"
        password = "admin123"
        if db.query(User).filter(User.email == email).first():
            print("Admin existe déjà")
            return
        admin = User(
            first_name="Admin",
            last_name="Super",
            email=email,
            role=RoleEnum.ADMIN,
            hashed_password=hash_password(password),
            is_active=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print("✅ Admin créé:", email, password, "id=", admin.id)
    finally:
        db.close()

if __name__ == "__main__":
    main()
