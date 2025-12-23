# services/tool_service.py
from sqlalchemy.orm import Session
from .. import models
from typing import List, Optional
import math

PAGE_SIZE = 12  # adjust to your frontend pagination

def create_tool(db: Session, payload: dict) -> models.Tool:
    # convert tags list -> comma str if needed
    tags = payload.get("tags")
    if isinstance(tags, list):
        payload["tags"] = ",".join([t for t in tags if t])
    tool = models.Tool(**payload)
    db.add(tool)
    db.commit()
    db.refresh(tool)
    return tool

def get_tool(db: Session, tool_id: int) -> Optional[models.Tool]:
    return db.query(models.Tool).filter(models.Tool.id == tool_id).first()

def update_tool(db: Session, tool_id: int, payload: dict) -> Optional[models.Tool]:
    tool = get_tool(db, tool_id)
    if not tool:
        return None
    if "tags" in payload and isinstance(payload["tags"], list):
        payload["tags"] = ",".join([t for t in payload["tags"] if t])
    for k, v in payload.items():
        setattr(tool, k, v)
    db.add(tool)
    db.commit()
    db.refresh(tool)
    return tool

def delete_tool(db: Session, tool_id: int) -> bool:
    tool = get_tool(db, tool_id)
    if not tool:
        return False
    db.delete(tool)
    db.commit()
    return True

def list_tools(db: Session, page: int = 1, page_size: int = PAGE_SIZE, search: str = "", tag: str = ""):
    query = db.query(models.Tool)

    if search:
        term = f"%{search}%"
        query = query.filter(
            (models.Tool.title.ilike(term)) |
            (models.Tool.description.ilike(term)) |
            (models.Tool.content.ilike(term))
        )

    if tag:
        # tag stored in comma-separated tags string
        tag_term = f"%{tag}%"
        query = query.filter(models.Tool.tags.ilike(tag_term))

    total = query.count()
    total_pages = max(1, math.ceil(total / page_size))
    items = query.order_by(models.Tool.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return items, total_pages
