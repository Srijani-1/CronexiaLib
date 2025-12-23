from fastapi import HTTPException
from sqlalchemy.orm import Session
from ..models import CommunityGroupMember


def require_owner(db: Session, group_id: int, user_id: int):
    member = db.query(CommunityGroupMember).filter_by(
        group_id=group_id,
        user_id=user_id,
        role="owner"
    ).first()

    if not member:
        raise HTTPException(status_code=403, detail="Owner permission required")


def require_admin_or_owner(db: Session, group_id: int, user_id: int):
    member = db.query(CommunityGroupMember).filter(
        CommunityGroupMember.group_id == group_id,
        CommunityGroupMember.user_id == user_id,
        CommunityGroupMember.role.in_(["admin", "owner"])
    ).first()

    if not member:
        raise HTTPException(status_code=403, detail="Admin permission required")
