from fastapi import APIRouter, Depends, HTTPException,status
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from ..core.auth import get_current_user
from ..schemas import UserResponse,UserProfileUpdate,UserProfile
from sqlalchemy import func

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/profile", response_model=UserProfile)
def get_profile(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.put("/profile/update", response_model=schemas.UserProfileUpdate)
def update_profile(update: schemas.UserProfileUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if phone number is being updated and if it's already taken by another user
    update_data = update.dict(exclude_unset=True)
    
    if 'phone' in update_data and update_data['phone']:
        existing_phone = db.query(models.User).filter(
            models.User.phone == update_data['phone'],
            models.User.id != current_user.id
        ).first()
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This phone number is already registered to another user"
            )
    
    # Check if email is being updated and if it's already taken by another user
    if 'email' in update_data and update_data['email']:
        existing_email = db.query(models.User).filter(
            models.User.email == update_data['email'],
            models.User.id != current_user.id
        ).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This email is already registered to another user"
            )
    
    # Update user fields
    for key, value in update_data.items():
        setattr(user, key, value)
    
    try:
        db.commit()
        db.refresh(user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}"
        )
    
    return user

@router.get("/stats")
def user_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    user_id = current_user.id

    total_prompts = db.query(models.Prompt).filter(models.Prompt.created_by == user_id).count()
    total_tools = db.query(models.Tool).filter(models.Tool.created_by == user_id).count()

    total_prompt_likes = db.query(func.sum(models.Prompt.likes)).filter(models.Prompt.created_by == user_id).scalar() or 0
    total_tool_likes = db.query(func.sum(models.Tool.likes)).filter(models.Tool.created_by == user_id).scalar() or 0
    total_likes = total_prompt_likes + total_tool_likes

    total_prompt_views = db.query(func.sum(models.Prompt.views)).filter(models.Prompt.created_by == user_id).scalar() or 0
    total_tool_views = db.query(func.sum(models.Tool.views)).filter(models.Tool.created_by == user_id).scalar() or 0
    total_views = total_prompt_views + total_tool_views

    return {
        "total_prompts": total_prompts,
        "total_tools": total_tools,
        "total_likes": total_likes,
        "total_views": total_views,
    }

@router.get("/{user_id}", response_model=schemas.UserResponse)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user
