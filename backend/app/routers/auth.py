from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.user import UserCreate, UserLogin
from app.services.auth_service import register_user, login_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register")
def register(user_data: UserCreate, db: Session=Depends(get_db)):
    user = register_user(db, user_data)

    if user is None:
        raise HTTPException(
            status_code=400,
            detail="Email already exists",
        )

    return {
        "message": "User registered successfully"
    }

@router.post("/login")
def login(user_data: UserLogin, db: Session=Depends(get_db)):
    user = login_user(db, user_data)

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid Email or Password"
        )

    return {
        "message": "User logined successfully"
    }