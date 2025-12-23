from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from .. import models, schemas
from ..core.auth import get_current_user

router = APIRouter(prefix="/community", tags=["Community"])

@router.get("/discussions/get", response_model=schemas.CommunityDiscussionListResponse)
def get_discussions(
    category: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    query = db.query(models.CommunityDiscussion)

    if category and category != "all":
        query = query.filter(models.CommunityDiscussion.category == category)

    total = query.count()
    offset = (page - 1) * limit

    discussions = (
        query
        .order_by(models.CommunityDiscussion.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return {
        "data": [
        {
            "id": d.id,
            "title": d.title,
            "content": d.content,
            "category": d.category,
            "tags": d.tags or [],
            "likes": d.likes or 0,
            "comments_count": d.comments_count or 0,
            "created_at": d.created_at,
            "created_by": d.created_by,
            "creator_name": d.creator.full_name,
        }
        for d in discussions
    ],

        "page": page,
        "limit": limit,
        "total": total
    }



@router.post("/discussions/create", response_model=schemas.CommunityDiscussionResponse)
def create_discussion(
    payload: schemas.CommunityDiscussionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    discussion = models.CommunityDiscussion(
        title=payload.title,
        content=payload.content,
        category=payload.category,
        tags=payload.tags or [],
        created_by=current_user.id
    )

    db.add(discussion)
    db.commit()
    db.refresh(discussion)

    return {
        "id": discussion.id,
        "title": discussion.title,
        "content": discussion.content,
        "category": discussion.category,
        "tags": discussion.tags or [],
        "likes": discussion.likes or 0,
        "comments_count": 0,
        "created_at": discussion.created_at,
        "created_by": discussion.created_by,
        "creator_name": current_user.full_name,
    }


@router.get("/groups/get", response_model=schemas.CommunityGroupListResponse)
def get_groups(
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    query = db.query(models.CommunityGroup)
    total = query.count()
    offset = (page - 1) * limit

    groups = (
        query
        .order_by(models.CommunityGroup.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return {
        "data": [
            {
                "id": g.id,
                "name": g.name,
                "description": g.description,
                "category": g.category,
                "members_count": len(g.members)
            }
            for g in groups
        ],
        "page": page,
        "limit": limit,
        "total": total
    }


@router.post("/groups/create", response_model=schemas.CommunityGroupResponse)
def create_group(
    payload: schemas.CommunityGroupCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    group = models.CommunityGroup(
        name=payload.name,
        description=payload.description,
        category=payload.category,
        owner_id=current_user.id
    )
    db.add(group)
    db.commit()
    db.refresh(group)

    owner_member = models.CommunityGroupMember(
        group_id=group.id,
        user_id=current_user.id,
        role="owner"
    )
    db.add(owner_member)
    db.commit()
    
    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "category": group.category,
        "members_count": 1
    }   

@router.get("/groups/{group_id}", response_model=schemas.CommunityGroupDetailResponse)
def get_group_details(group_id: int, db: Session = Depends(get_db)):
    group = db.query(models.CommunityGroup).get(group_id)
    if not group:
        raise HTTPException(404, "Group not found")

    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "category": group.category,
        "owner_name": group.owner.full_name,
        "members": [
            {"id": m.user.id, "full_name": m.user.full_name, "role": m.role, "joined_at": m.joined_at}
            for m in group.members
        ]
    }

@router.post("/groups/{group_id}/join")
def join_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    existing = db.query(models.CommunityGroupMember).filter_by(
        group_id=group_id,
        user_id=current_user.id
    ).first()
    group = db.get(models.CommunityGroup, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if existing:
        raise HTTPException(status_code=400, detail="Already a member")

    member = models.CommunityGroupMember(
        group_id=group_id,
        user_id=current_user.id,
        role="member"
    )

    db.add(member)
    db.commit()

    return {"message": "Joined group successfully"}

@router.get(
    "/discussions/{discussion_id}",
    response_model=schemas.CommunityDiscussionDetailResponse
)
def get_discussion_detail(
    discussion_id: int,
    db: Session = Depends(get_db)
):
    discussion = (
        db.query(models.CommunityDiscussion)
        .filter(models.CommunityDiscussion.id == discussion_id)
        .first()
    )

    if not discussion:
        raise HTTPException(status_code=404, detail="Discussion not found")

    return {
        "id": discussion.id,
        "title": discussion.title,
        "content": discussion.content,
        "category": discussion.category,
        "tags": discussion.tags or [],
        "creator_name": discussion.creator.full_name,
        "created_at": discussion.created_at,
        "likes": discussion.likes or 0,
        "comments_count": discussion.comments_count or 0,
        "comments": [
            {
                "id": c.id,
                "content": c.content,
                "user_name": c.user.full_name,
                "created_at": c.created_at,
            }
            for c in discussion.comments
        ],
    }

@router.post(
    "/discussions/{discussion_id}/comments",
    response_model=schemas.CommunityCommentResponse
)
def add_comment(
    discussion_id: int,
    payload: schemas.CommunityCommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    discussion = db.get(models.CommunityDiscussion, discussion_id)
    if not discussion:
        raise HTTPException(404, "Discussion not found")

    comment = models.CommunityComment(
        discussion_id=discussion_id,
        user_id=current_user.id,
        content=payload.content
    )

    discussion.comments_count = (discussion.comments_count or 0) + 1

    db.add(comment)
    db.commit()
    db.refresh(comment)

    return {
        "id": comment.id,
        "content": comment.content,
        "user_name": current_user.full_name,
        "created_at": comment.created_at
    }

@router.put("/groups/{group_id}/promote/{user_id}")
def promote_member(
    group_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    owner = db.query(models.CommunityGroupMember).filter_by(
        group_id=group_id,
        user_id=current_user.id,
        role="owner"
    ).first()

    if not owner:
        raise HTTPException(403, "Only owner can promote")

    member = db.query(models.CommunityGroupMember).filter_by(
        group_id=group_id,
        user_id=user_id
    ).first()

    if not member:
        raise HTTPException(404, "User is not a group member")

    member.role = "admin"
    db.commit()

    return {"message": "User promoted to admin"}

@router.delete("/groups/{group_id}")
def delete_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    owner = db.query(models.CommunityGroupMember).filter_by(
        group_id=group_id,
        user_id=current_user.id,
        role="owner"
    ).first()
    group = db.get(models.CommunityGroup, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if not owner:
        raise HTTPException(status_code=403, detail="Only owner can delete group")

    db.delete(group)
    db.commit()

    return {"message": "Group deleted"}

@router.get("/groups/{group_id}/messages")
def get_group_messages(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    member = db.query(models.CommunityGroupMember).filter_by(
        group_id=group_id,
        user_id=current_user.id
    ).first()

    if not member:
        raise HTTPException(403, "Join the group to view messages")

    messages = (
        db.query(models.CommunityGroupMessage)
        .filter_by(group_id=group_id)
        .order_by(models.CommunityGroupMessage.created_at.asc())
        .all()
    )

    return [
        {
            "id": m.id,
            "content": m.content,
            "user_name": m.user.full_name,
            "created_at": m.created_at
        }
        for m in messages
    ]

