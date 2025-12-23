from fastapi import APIRouter, Depends, HTTPException,Query
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..core.auth import get_current_user
from datetime import datetime
from fastapi import status
from sqlalchemy import func

router = APIRouter(prefix="/prompts", tags=["Prompts"])

@router.post("/create", response_model=schemas.PromptResponse)
def create_prompt(prompt: schemas.PromptCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),):
    new_prompt = models.Prompt(
        title=prompt.title,
        description=prompt.description,
        tags=prompt.tags,
        content=prompt.content,
        category=prompt.category,
        recommended_model=prompt.recommended_model,
        created_at=datetime.now(),
        creator_name=current_user.full_name,
        created_by=current_user.id,
    )
    db.add(new_prompt)
    db.commit()
    db.refresh(new_prompt)
    return new_prompt

@router.get("/", response_model=schemas.PromptListResponse)
def get_all_prompts(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    search: str | None = None,
    category: str | None = None,
    model: str | None = None,
    tag: str | None = None,
    db: Session = Depends(get_db)
):
    skip = (page - 1) * limit

    query = db.query(models.Prompt)

    # 🔍 SEARCH FILTER
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            models.Prompt.title.ilike(search_term) |
            models.Prompt.description.ilike(search_term) |
            models.Prompt.category.ilike(search_term) |
            models.Prompt.tags.ilike(search_term)
        )

    # 📂 CATEGORY FILTER
    if category:
        query = query.filter(models.Prompt.category.ilike(f"%{category}%"))

    # 🤖 MODEL FILTER
    if model:
        query = query.filter(models.Prompt.recommended_model.ilike(f"%{model}%"))

    # 🏷 TAG FILTER
    if tag:
        # Assuming tags are stored as comma-separated strings or JSON text that contains the tag
        query = query.filter(models.Prompt.tags.ilike(f"%{tag}%"))

    total_prompts = query.count()

    prompts = (
        query.order_by(models.Prompt.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    total_pages = (total_prompts + limit - 1) // limit

    # tags conversion
    for p in prompts:
        if isinstance(p.tags, list):
            pass
        elif isinstance(p.tags, str):
            p.tags = [t.strip() for t in p.tags.split(",") if t.strip()]
        else:
            p.tags = []

    return {"data": prompts, "total_pages": total_pages}


@router.get("/my", response_model=schemas.PromptListResponse)
def my_prompts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    prompts = db.query(models.Prompt)\
                .filter(models.Prompt.created_by == current_user.id)\
                .order_by(models.Prompt.created_at.desc())\
                .all()

    total_pages = 1  # Since this is "my prompts", no pagination applied

    return {
        "data": prompts,
        "total_pages": total_pages
    }

@router.get("/filters")
def get_prompt_filters(db: Session = Depends(get_db)):

    # 1. UNIQUE CATEGORIES
    categories = (
        db.query(models.Prompt.category)
        .distinct()
        .filter(models.Prompt.category.isnot(None))
        .all()
    )
    categories = [c[0] for c in categories]

    # 2. UNIQUE USE CASE TAGS
    prompts = db.query(models.Prompt.tags).all()
    tags_set = set()

    for (tag_value,) in prompts:
        if not tag_value:
            continue

        if isinstance(tag_value, list):
            tags_set.update([t.strip() for t in tag_value if isinstance(t, str)])

        elif isinstance(tag_value, str):
            tag_list = [t.strip() for t in tag_value.split(",") if t.strip()]
            tags_set.update(tag_list)

    tags = sorted(list(tags_set))



    # 3. UNIQUE MODELS
    models_list = (
        db.query(models.Prompt.recommended_model)
        .distinct()
        .filter(models.Prompt.recommended_model.isnot(None))
        .all()
    )
    models_list = [m[0] for m in models_list]

    return {
        "categories": categories,
        "use_cases": tags,
        "models": models_list
    }

@router.get("/liked", response_model=schemas.PromptListResponse)
def liked_prompts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    liked = (
        db.query(models.Prompt)
        .join(models.LikedPrompt, models.LikedPrompt.prompt_id == models.Prompt.id)
        .filter(models.LikedPrompt.user_id == current_user.id)
        .order_by(models.LikedPrompt.liked_at.desc())
        .all()
    )

    results = []

    for p in liked:
        # convert tags
        if isinstance(p.tags, list):
            tags = p.tags
        elif isinstance(p.tags, str):
            tags = [t.strip() for t in p.tags.split(",") if t.strip()]
        else:
            tags = p.tags or []

        results.append({
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "content": p.content,
            "category": p.category,
            "tags": tags,
            "recommended_model": p.recommended_model,
            "likes": p.likes,
            "views": p.views,
            "downloads": p.downloads,
            "created_at": p.created_at,
            "created_by": p.created_by,
            "creator_name": p.creator_name or (p.creator.full_name if p.creator else "")
        })

    return {
        "data": results,
        "total_pages": 1
    }


# ----------------------------------------
#  GET SINGLE PROMPT
# ----------------------------------------
from ..models import PromptView
from fastapi import Depends

@router.get("/{prompt_id}", response_model=schemas.PromptResponse)
def get_prompt(
    prompt_id: int,
    db: Session = Depends(get_db), 
):
    prompt = db.query(models.Prompt).filter(models.Prompt.id == prompt_id).first()

    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    # 🔍 Check if this user has already viewed it
    existing_view = db.query(PromptView).filter(
        PromptView.user_id == prompt.created_by,
        PromptView.prompt_id == prompt_id
    ).first()

    if not existing_view:
        # Add a new view record
        new_view = PromptView(user_id=prompt.created_by, prompt_id=prompt_id)
        db.add(new_view)

        # Increment total prompt views
        prompt.views = (prompt.views or 0) + 1

        db.commit()
        db.refresh(prompt)

    return prompt

@router.post("/{prompt_id}/like")
def like_prompt(
    prompt_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    prompt = db.query(models.Prompt).filter(models.Prompt.id == prompt_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    existing_like = db.query(models.LikedPrompt).filter(
        models.LikedPrompt.user_id == current_user.id,
        models.LikedPrompt.prompt_id == prompt_id
    ).first()

    if existing_like:
        # Unlike
        db.delete(existing_like)
        if prompt.likes and prompt.likes > 0:
            prompt.likes -= 1
        message = "Prompt unliked"
    else:
        # Like
        new_like = models.LikedPrompt(user_id=current_user.id, prompt_id=prompt_id)
        db.add(new_like)
        prompt.likes = (prompt.likes or 0) + 1
        message = "Prompt liked"

    db.commit()
    return {"message": message, "likes": prompt.likes}


# ----------------------------------------
#  UPDATE A PROMPT
# ----------------------------------------
@router.put("/{prompt_id}", response_model=schemas.PromptResponse)
def update_prompt(
    prompt_id: int,
    updated: schemas.PromptUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    prompt = db.query(models.Prompt).filter(models.Prompt.id == prompt_id).first()

    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    # Optional: Only allow creator to edit
    if prompt.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    for key, value in updated.dict().items():
        setattr(prompt, key, value)

    db.commit()
    db.refresh(prompt)

    return prompt


# ----------------------------------------
#  DELETE A PROMPT
# ----------------------------------------
@router.delete("/{prompt_id}")
def delete_prompt(
    prompt_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    prompt = db.query(models.Prompt).filter(models.Prompt.id == prompt_id).first()

    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    # Optional: Only allow creator to delete
    if prompt.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(prompt)
    db.commit()

    return {"message": "Prompt deleted successfully", "id": prompt_id}
