from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import hash_password

# Register a new user
def register_user(db: Session, user_data: UserCreate):
    existing_user = db.scalar(
        select(User).where(User.email == user_data.email)
    )

    if existing_user:
        return None

    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password=hash_password(user_data.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user