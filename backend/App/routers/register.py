from fastapi import APIRouter, HTTPException
from ..database import SessionLocal
from passlib.context import CryptContext
from sqlalchemy.exc import IntegrityError
from ..models import User
from .. import schemas
from datetime import datetime

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/register")
def register_user(user: schemas.UserCreate):
    db = SessionLocal()
    # check duplicates directly on plain email/phone
    existing_email = db.query(User).filter(User.email == user.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    existing_phone = db.query(User).filter(User.phone == user.phone).first()
    if existing_phone:
        raise HTTPException(status_code=400, detail="Phone number already registered")


    new_user = User(
        full_name=user.full_name,
        email=user.email,  # ✅ lookup hash
        phone=user.phone,
        hashed_password=pwd_context.hash(user.password)
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email or phone already exists")
    finally:
        db.close()

    return {"message": "User registered successfully"}
