from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from .. import models, schemas
from ..database import get_db
from ..core.auth import generate_token

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/login")
def login(request: schemas.UserLogin, db: Session = Depends(get_db)):
    identifier = request.identifier

    user = db.query(models.User).filter(
        (models.User.email == identifier) |
        (models.User.phone == identifier)
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/phone"
        )

    # ✅ verify password
    if not pwd_context.verify(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password"
        )

    # ✅ generate JWT token
    access_token = generate_token(
        data={"sub": str(user.id)}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,  # decrypt for API response
            "email": user.email,
            "phone": user.phone
        }
    }