from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from typing import List
from ..database import get_db
import traceback
from .. import schemas, models
from ..services import agent_service
from ..core.auth import get_current_user
import uuid

# request_id = uuid.uuid4()
# print("CREATE_AGENT_REQUEST:", request_id)


router = APIRouter(prefix="/agents", tags=["Agents"])

@router.post("/create", response_model=schemas.AgentRead)
def create_agent_endpoint(
    payload: schemas.AgentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return agent_service.create_agent(
        db=db,
        user_id=current_user.id,
        creator_name=current_user.full_name,
        payload=payload,
    )

@router.get("/", response_model=schemas.AgentListResponse)
def list_agents(
    search: Optional[str] = Query("", description="Search over title / description / content"),
    tag: Optional[str] = Query("", description="Filter by tag"),
    tools: Optional[str] = Query(None, description="Filter by tools"),
    model: Optional[str] = Query(None, description="Filter by model"),
    page: int = Query(1, ge=1),
    limit: int = 12,
    db: Session = Depends(get_db)
):
    query = db.query(models.Agent)
    if search:
        query = query.filter(
            models.Agent.title.ilike(f"%{search}%") |
            models.Agent.description.ilike(f"%{search}%")
        )

    # 🔖 Tag filter
    if tag:
        # Assuming tags are stored as comma-separated strings
        query = query.filter(models.Agent.tags.ilike(f"%{tag}%"))

    # 💻 Language filter
    if tools:
        query = query.filter(models.Agent.tools.ilike(f"%{tools}%"))

    # 🤖 Model filter
    if model:
        query = query.filter(models.Agent.model.ilike(f"%{model}%"))

    total = query.count()

    agents = (
        query.order_by(models.Agent.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    total_pages = (total + limit - 1) // limit

    # normalize tags
    for t in agents:
        if isinstance(t.tags, str):
            t.tags = [x.strip() for x in t.tags.split(",") if x.strip()]
        elif t.tags is None:
            t.tags = []

    return {"data": agents, "total_pages": total_pages}

@router.get("/my", response_model=schemas.AgentListResponse)
def my_tools(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    agents = (
        db.query(models.Agent)
        .filter(models.Agent.created_by == current_user.id)
        .order_by(models.Agent.created_at.desc())
        .all()
    )

    # normalize tags
    for t in agents:
        if isinstance(t.tags, str):
            t.tags = [x.strip() for x in t.tags.split(",") if x.strip()]
        elif t.tags is None:
            t.tags = []

    return {"data": agents, "total_pages": 1}

@router.get("/liked", response_model=schemas.AgentListResponse)
def get_liked_agents(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    liked = (
        db.query(models.Agent)
        .join(models.LikedAgent, models.LikedAgent.agent_id == models.Agent.id)
        .filter(models.LikedAgent.user_id == current_user.id)
        .order_by(models.LikedAgent.liked_at.desc())
        .all()
    )
    results = []

    for t in liked:
        # normalize tags
        if isinstance(t.tags, str):
            tags = [x.strip() for x in t.tags.split(",") if x.strip()]
        else:
            tags = t.tags or []

        results.append({
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "system_prompt": t.system_prompt,
            "tags": tags,
            "model": t.model,
            "temperature": t.temperature,
            "max_tokens": t.max_tokens,
            "visibility": t.visibility,
            "likes": t.likes,
            "views": t.views,
            "created_at": t.created_at,
            "created_by": t.created_by,
            "creator_name": t.creator_name or (t.creator.full_name if t.creator else "")
        })

    return {"data": results, "total_pages": 1}

@router.post("/{agent_id}/like")
def like_agent(
    agent_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    existing_like = db.query(models.LikedAgent).filter(
        models.LikedAgent.user_id == current_user.id,
        models.LikedAgent.agent_id == agent_id
    ).first()

    if existing_like:
        db.delete(existing_like)
        if agent.likes and agent.likes > 0:
            agent.likes -= 1
        msg = "Agent unliked"
    else:
        new_like = models.LikedAgent(user_id=current_user.id, agent_id=agent_id)
        db.add(new_like)
        agent.likes = (agent.likes or 0) + 1
        msg = "Agent liked"

    db.commit()
    return {"message": msg, "likes": agent.likes}

@router.get("/filters")
def get_agent_filters(db: Session = Depends(get_db)):
    # 1. Tools Used
    # We want to get names of tools that are actually used in agents
    tools_used_raw = (
        db.query(models.AgentTool.name)
        .distinct()
        .all()
    )
    tools_used = [t[0] for t in tools_used_raw if t[0]]

    # 2. Tags
    tags_set = set()
    all_tags = db.query(models.Agent.tags).all()

    for (tag_value,) in all_tags:
        if not tag_value:
            continue
        if isinstance(tag_value, list):
            tags_set.update(tag_value)
        elif isinstance(tag_value, str):
            tags_set.update([x.strip() for x in tag_value.split(",") if x.strip()])

    tags = sorted(list(tags_set))

    # 3. Models
    models_raw = (
        db.query(models.Agent.model)
        .distinct()
        .filter(models.Agent.model.isnot(None))
        .all()
    )
    models_list = [m[0] for m in models_raw if m[0]]

    return {
        "tags": tags,
        "models": models_list,
        "tools": tools_used
    }


@router.get("/{agent_id}", response_model=schemas.AgentRead)
def get_agent(agent_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user),):
    agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Increment views
    existing_view = db.query(models.AgentView).filter(
        models.AgentView.user_id == current_user.id,
        models.AgentView.agent_id == agent_id
    ).first()

    db.commit()
    if not existing_view:
        # Add a new view record
        new_view = models.AgentView(user_id=current_user.id, agent_id=agent_id)
        db.add(new_view)

        # Increment total agent views
        agent.views = (agent.views or 0) + 1

        db.commit()
        db.refresh(agent)

    # normalize tags
    if isinstance(agent.tags, str):
        agent.tags = [x.strip() for x in agent.tags.split(",") if x.strip()]
    else:
        agent.tags = agent.tags or []

    if not agent.creator_name and agent.creator:
        agent.creator_name = agent.creator.full_name

    return agent

@router.put("/{agent_id}", response_model=schemas.AgentRead)
def update_agent(
    agent_id: int,
    payload: schemas.AgentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    agent = db.query(models.Agent).filter(
        models.Agent.id == agent_id,
        models.Agent.created_by == current_user.id
    ).first()

    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found or unauthorized")

    agent.title = payload.title
    agent.description = payload.description
    agent.system_prompt = payload.system_prompt
    agent.model = payload.model
    agent.temperature = payload.temperature
    agent.max_tokens = payload.max_tokens
    agent.visibility = payload.visibility
    agent.instructions = payload.instructions

    # Clear & replace tools
    db.query(models.AgentTool).filter(models.AgentTool.agent_id == agent.id).delete()
    for tool in payload.tools:
        db.add(models.AgentTool(
            agent_id=agent.id,
            tool_id=tool.tool_id if hasattr(tool, 'tool_id') else None,
            name=tool.name if hasattr(tool, 'name') else None,
            description=tool.description if hasattr(tool, 'description') else None,
            code=tool.code if hasattr(tool, 'code') else None,
            enabled=tool.enabled if hasattr(tool, 'enabled') else True,
            config=tool.config if hasattr(tool, 'config') else None,
        ))

    # Clear & replace prompts
    db.query(models.AgentPrompt).filter(models.AgentPrompt.agent_id == agent.id).delete()
    for prompt in payload.prompts:
        db.add(models.AgentPrompt(
            agent_id=agent.id,
            prompt_id=prompt.prompt_id if hasattr(prompt, 'prompt_id') else None,
            role=prompt.role,
            content=prompt.content if hasattr(prompt, 'content') else None,
            order=prompt.order,
        ))

    db.commit()
    db.refresh(agent)
    return agent

@router.post("/{agent_id}/clone", response_model=schemas.AgentRead)
def clone_agent_endpoint(
    agent_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404)

    return agent_service.clone_agent(db, agent, current_user.id, current_user.full_name)

@router.delete("/{agent_id}")
def delete_agent(
    agent_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    agent = db.query(models.Agent).filter(
        models.Agent.id == agent_id,
        models.Agent.created_by == current_user.id,
    ).first()

    if not agent:
        raise HTTPException(status_code=404)

    db.delete(agent)
    db.commit()
    return {"success": True}

# @router.post("/{agent_id}/view")
# def view_agent(
#     agent_id: int,
#     db: Session = Depends(get_db),
#     current_user=Depends(get_current_user),
# ):
#     agent = db.query(Agent).filter(Agent.id == agent_id).first()
#     if not agent:
#         raise HTTPException(status_code=404)

#     viewed = db.query(AgentView).filter_by(
#         agent_id=agent_id,
#         user_id=current_user.id
#     ).first()

#     if not viewed:
#         db.add(models.AgentView(
#             agent_id=agent_id,
#             user_id=current_user.id
#         ))
#         agent.views += 1
#         db.commit()

#     return {"views": agent.views}

@router.post("/{agent_id}/run")
async def run_agent(agent_id: int, payload: schemas.AgentRunRequest, db: Session = Depends(get_db)):
    result = await agent_service.run_agent(db, agent_id, payload.input)
    if not result:
        raise HTTPException(status_code=404, detail="Agent not found")
    return result

@router.post("/test")
async def test_agent_preview(payload: schemas.AgentTestRequest, db: Session = Depends(get_db)):
    return await agent_service.test_agent(db, payload)
