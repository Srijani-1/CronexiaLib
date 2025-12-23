from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..core.auth import get_current_user
from .. import models
from sqlalchemy import func

router = APIRouter(prefix="/users", tags=["User Stats"])


@router.get("/stats")
def user_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    user_id = current_user.id

    total_prompts = db.query(models.Prompt).filter(models.Prompt.created_by == user_id).count()
    total_tools = db.query(models.Tool).filter(models.Tool.created_by == user_id).count()
    total_agents = db.query(models.Agent).filter(models.Agent.created_by == user_id).count()

    total_prompt_likes = db.query(func.sum(models.Prompt.likes)).filter(models.Prompt.created_by == user_id).scalar() or 0
    total_tool_likes = db.query(func.sum(models.Tool.likes)).filter(models.Tool.created_by == user_id).scalar() or 0
    total_agent_likes = db.query(func.sum(models.Agent.likes)).filter(models.Agent.created_by == user_id).scalar() or 0
    total_likes = total_prompt_likes + total_tool_likes + total_agent_likes

    total_prompt_views = db.query(func.sum(models.Prompt.views)).filter(models.Prompt.created_by == user_id).scalar() or 0
    total_tool_views = db.query(func.sum(models.Tool.views)).filter(models.Tool.created_by == user_id).scalar() or 0
    total_agent_views = db.query(func.sum(models.Agent.views)).filter(models.Agent.created_by == user_id).scalar() or 0
    total_views = total_prompt_views + total_tool_views + total_agent_views
    print("STATS RETURN:", {
    "total_prompts": total_prompts,
    "total_tools": total_tools,
    "total_agents": total_agents,
    "total_likes": total_likes,
    "total_views": total_views,
})
    return {
        "total_prompts": total_prompts,
        "total_tools": total_tools,
        "total_agents": total_agents,
        "total_likes": total_likes,
        "total_views": total_views,
    }
