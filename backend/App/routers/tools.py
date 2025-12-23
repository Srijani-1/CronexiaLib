from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from .. import schemas, models
from google.adk.runners import RunConfig
from google.adk.runners import Runner
from google.adk.events import Event, EventActions
from ..agents.tool_runner_agent import runner, session_service
from ..database import get_db
from ..core.auth import get_current_user
from datetime import datetime
from sqlalchemy import func
from google.genai import Client
from google.adk.models.lite_llm import LiteLlm
import uuid

router = APIRouter(prefix="/tools", tags=["Tools"])

# ----------------------------------------------------------------------
#  CREATE TOOL
# ----------------------------------------------------------------------
@router.post("/create", response_model=schemas.ToolResponse)
def create_tool(
    tool: schemas.ToolCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    new_tool = models.Tool(
        title=tool.title,
        description=tool.description,
        content=tool.content,
        tags=tool.tags or [],
        recommended_model=tool.recommended_model,
        language=tool.language,
        version=tool.version,
        instructions=tool.instructions,
        created_at=datetime.now(),
        created_by=current_user.id,
        creator_name=current_user.full_name
    )
    db.add(new_tool)
    db.commit()
    db.refresh(new_tool)
    return new_tool


# ----------------------------------------------------------------------
#  LIST ALL TOOLS
# ----------------------------------------------------------------------
@router.get("/", response_model=schemas.ToolListResponse)
def list_all_tools(
    search: Optional[str] = Query("", description="Search over title / description / content"),
    tag: Optional[str] = Query("", description="Filter by tag"),
    language: Optional[str] = Query(None, description="Filter by language"),
    model: Optional[str] = Query(None, description="Filter by recommended model"),
    page: int = Query(1, ge=1),
    limit: int = 12,
    db: Session = Depends(get_db)
):
    query = db.query(models.Tool)

    # 🔍 Search
    if search:
        query = query.filter(
            models.Tool.title.ilike(f"%{search}%") |
            models.Tool.description.ilike(f"%{search}%") |
            models.Tool.content.ilike(f"%{search}%")
        )

    # 🔖 Tag filter
    if tag:
        # Assuming tags are stored as comma-separated strings
        query = query.filter(models.Tool.tags.ilike(f"%{tag}%"))

    # 💻 Language filter
    if language:
        query = query.filter(models.Tool.language.ilike(f"%{language}%"))

    # 🤖 Model filter
    if model:
        query = query.filter(models.Tool.recommended_model.ilike(f"%{model}%"))

    total = query.count()

    tools = (
        query.order_by(models.Tool.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    total_pages = (total + limit - 1) // limit

    # normalize tags
    for t in tools:
        if isinstance(t.tags, str):
            t.tags = [x.strip() for x in t.tags.split(",") if x.strip()]
        elif t.tags is None:
            t.tags = []

    return {"data": tools, "total_pages": total_pages}


# ----------------------------------------------------------------------
#  GET MY TOOLS
# ----------------------------------------------------------------------
@router.get("/my", response_model=schemas.ToolListResponse)
def my_tools(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    tools = (
        db.query(models.Tool)
        .filter(models.Tool.created_by == current_user.id)
        .order_by(models.Tool.created_at.desc())
        .all()
    )

    # normalize tags
    for t in tools:
        if isinstance(t.tags, str):
            t.tags = [x.strip() for x in t.tags.split(",") if x.strip()]
        elif t.tags is None:
            t.tags = []

    return {"data": tools, "total_pages": 1}


# ----------------------------------------------------------------------
#  GET LIKED TOOLS
# ----------------------------------------------------------------------
@router.get("/liked", response_model=schemas.ToolListResponse)
def liked_tools(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    liked = (
        db.query(models.Tool)
        .join(models.LikedTool, models.LikedTool.tool_id == models.Tool.id)
        .filter(models.LikedTool.user_id == current_user.id)
        .order_by(models.LikedTool.liked_at.desc())
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
            "content": t.content,
            "tags": tags,
            "recommended_model": t.recommended_model,
            "language": t.language,
            "version": t.version,
            "instructions": t.instructions,
            "likes": t.likes,
            "views": t.views,
            "created_at": t.created_at,
            "created_by": t.created_by,
            "creator_name": t.creator_name or (t.creator.full_name if t.creator else "")
        })

    return {"data": results, "total_pages": 1}


# ----------------------------------------------------------------------
#  LIKE / UNLIKE TOOL
# ----------------------------------------------------------------------
@router.post("/{tool_id}/like")
def like_tool(
    tool_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    tool = db.query(models.Tool).filter(models.Tool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    existing_like = db.query(models.LikedTool).filter(
        models.LikedTool.user_id == current_user.id,
        models.LikedTool.tool_id == tool_id
    ).first()

    if existing_like:
        db.delete(existing_like)
        if tool.likes and tool.likes > 0:
            tool.likes -= 1
        msg = "Tool unliked"
    else:
        new_like = models.LikedTool(user_id=current_user.id, tool_id=tool_id)
        db.add(new_like)
        tool.likes = (tool.likes or 0) + 1
        msg = "Tool liked"

    db.commit()
    return {"message": msg, "likes": tool.likes}

# ----------------------------------------------------------------------
#  TOOL FILTERS
# ----------------------------------------------------------------------
@router.get("/filters")
def get_tool_filters(db: Session = Depends(get_db)):
    # 1. Languages
    languages = (
        db.query(models.Tool.language)
        .distinct()
        .filter(models.Tool.language.isnot(None))
        .all()
    )
    languages = [l[0] for l in languages]

    # 2. Tags
    tags_set = set()
    all_tags = db.query(models.Tool.tags).all()

    for (tag_value,) in all_tags:
        if not tag_value:
            continue

        if isinstance(tag_value, list):
            tags_set.update(tag_value)
        elif isinstance(tag_value, str):
            tags_set.update([x.strip() for x in tag_value.split(",") if x.strip()])

    tags = sorted(list(tags_set))

    # 3. Models
    models_list = (
        db.query(models.Tool.recommended_model)
        .distinct()
        .filter(models.Tool.recommended_model.isnot(None))
        .all()
    )
    models_list = [m[0] for m in models_list]

    return {
        "languages": languages,
        "use_cases": tags,
        "models": models_list
    }


# ----------------------------------------------------------------------
#  GET SINGLE TOOL (WITH VIEWS)
# ----------------------------------------------------------------------
@router.get("/{tool_id}", response_model=schemas.ToolResponse)
def get_single_tool(
    tool_id: int,
    db: Session = Depends(get_db)
):
    tool = db.query(models.Tool).filter(models.Tool.id == tool_id).first()

    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    # Increment views
    existing_view = db.query(models.ToolView).filter(
        models.ToolView.user_id == tool.created_by,
        models.ToolView.tool_id == tool_id
    ).first()
    db.commit()
    if not existing_view:
        # Add a new view record
        new_view = models.ToolView(user_id=tool.created_by, tool_id=tool_id)
        db.add(new_view)

        # Increment total tool views
        tool.views = (tool.views or 0) + 1

        db.commit()
        db.refresh(tool)

    # normalize tags
    if isinstance(tool.tags, str):
        tool.tags = [x.strip() for x in tool.tags.split(",") if x.strip()]
    else:
        tool.tags = tool.tags or []

    if not tool.creator_name and tool.creator:
        tool.creator_name = tool.creator.full_name

    return tool



# ----------------------------------------------------------------------
#  UPDATE TOOL
# ----------------------------------------------------------------------
@router.put("/{tool_id}", response_model=schemas.ToolResponse)
def update_single_tool(
    tool_id: int,
    payload: schemas.ToolUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    tool = db.query(models.Tool).filter(models.Tool.id == tool_id,
    models.Tool.created_by == current_user.id).first()

    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    if tool.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    data = payload.dict(exclude_unset=True)

    for key, value in data.items():
        setattr(tool, key, value)

    db.commit()
    db.refresh(tool)
    return tool


# ----------------------------------------------------------------------
#  DELETE TOOL
# ----------------------------------------------------------------------
@router.delete("/{tool_id}")
def delete_tool(
    tool_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    tool = db.query(models.Tool).filter(models.Tool.id == tool_id,
    models.Tool.created_by == current_user.id).first()

    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    if tool.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(tool)
    db.commit()

    return {"message": "Tool deleted successfully", "id": tool_id}

class UserMessage:
    def __init__(self, content: str):
        self.role = "user"
        self.parts = [{"text": content}]

@router.post("/{tool_id}/run")
async def run_tool(tool_id: int, db: Session = Depends(get_db)):
    tool = db.query(models.Tool).filter(models.Tool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    user_prompt = (
        "Analyze and simulate this tool.\n\n"
        f"Title: {tool.title}\n"
        f"Description: {tool.description}\n"
        f"Content:\n{tool.content}\n"
    )

    session_id = str(uuid.uuid4())
    
    # Explicitly create the session in the service (Async)
    try:
        await session_service.create_session(
            session_id=session_id,
            app_name="AgentHub",
            user_id="default_user"
        )
    except Exception as exc:
        print(f"Error creating session: {exc}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Session creation failed: {str(exc)}")
    
    config = RunConfig()

    try:
        # Wrap prompt in an object with .role attribute
        message = UserMessage(user_prompt)
        
        events = []
        async for ev in runner.run_async(
            user_id="default_user",
            session_id=session_id,
            new_message=message,
            run_config=config
        ):
            events.append(ev)

        output = ""
        print(f"DEBUG: Captured {len(events)} events.")
        for i, ev in enumerate(events):
            print(f"DEBUG Event {i}: {ev}") 
            # Check for agent state output
            if hasattr(ev, "actions") and ev.actions and ev.actions.agent_state and "output" in ev.actions.agent_state:
                 output += ev.actions.agent_state["output"]
            
            # Check for standard model response (chat text) - 'model_response' might be 'content'
            if hasattr(ev, "model_response") and ev.model_response and hasattr(ev.model_response, "parts"):
                for part in ev.model_response.parts:
                    if hasattr(part, "text"):
                        output += part.text

            # Check for 'content' attribute (as seen in debug logs)
            if hasattr(ev, "content") and ev.content and hasattr(ev.content, "parts"):
                for part in ev.content.parts:
                    # 'part' might be an object with .text or a dict
                    if hasattr(part, "text"):
                        output += part.text
                    elif isinstance(part, dict) and "text" in part:
                         output += part["text"]

        if not output:
            output = "(no output)"

        return {"tool_id": tool_id, "output": output}

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Runner failed: {str(e)}")


@router.post("/{tool_id}/instructions")
async def generate_tool_instructions_by_id(
    tool_id: int,
    db: Session = Depends(get_db)
):
    tool = db.query(models.Tool).filter(models.Tool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    user_prompt = (
        "Based on the code provided below, write a specific integration guide for a developer.\n"
        "Focus ONLY on providing the necessary steps and code to add this tool to an agent system.\n"
        "Your response MUST include:\n"
        "1. A code snippet showing how to initialize a Main Agent that registers and calls this tool.\n"
        "2. A description of the file structure or specific files needed to support this tool.\n"
        "3. Any imports or dependencies required.\n\n"
        "Do NOT provide a general summary unless required for integration.\n\n"
        f"Title: {tool.title}\n"
        f"Description: {tool.description}\n"
        f"Code:\n{tool.content}\n"
    )

    session_id = str(uuid.uuid4())

    await session_service.create_session(
        session_id=session_id,
        app_name="AgentHub",
        user_id="default_user"
    )

    message = UserMessage(user_prompt)
    config = RunConfig()

    final_text = None

    async for ev in runner.run_async(
        user_id="default_user",
        session_id=session_id,
        new_message=message,
        run_config=config
    ):
        # Prefer agent_state output if it exists
        if (
            hasattr(ev, "actions")
            and ev.actions
            and ev.actions.agent_state
            and ev.actions.agent_state.get("output")
        ):
            final_text = ev.actions.agent_state["output"]
            break

        # Otherwise keep OVERWRITING with latest content
        if hasattr(ev, "content") and ev.content:
            parts = []
            for part in ev.content.parts:
                if hasattr(part, "text"):
                    parts.append(part.text)
            if parts:
                final_text = "".join(parts)

    output = (final_text or "(no output)").strip()
    return {"output": output}

@router.post("/generate-instructions")
async def generate_tool_instructions(
    payload: schemas.ToolInstructionGenerate
):
    user_prompt = (
        "Based on the code provided below, write a specific integration guide for a developer.\n"
        "Focus ONLY on providing the necessary steps and code to add this tool to an agent system.\n"
        "Your response MUST include:\n"
        "1. A code snippet showing how to initialize a Main Agent that registers and calls this tool.\n"
        "2. A description of the file structure or specific files needed to support this tool.\n"
        "3. Any imports or dependencies required.\n\n"
        "Do NOT provide a general summary unless required for integration.\n\n"
        f"Title: {payload.title}\n"
        f"Description: {payload.description}\n"
        f"Code:\n{payload.code}\n"
    )

    session_id = str(uuid.uuid4())

    await session_service.create_session(
        session_id=session_id,
        app_name="AgentHub",
        user_id="default_user"
    )

    message = UserMessage(user_prompt)
    config = RunConfig()

    final_text = None

    async for ev in runner.run_async(
        user_id="default_user",
        session_id=session_id,
        new_message=message,
        run_config=config
    ):
        # Prefer agent_state output if it exists
        if (
            hasattr(ev, "actions")
            and ev.actions
            and ev.actions.agent_state
            and ev.actions.agent_state.get("output")
        ):
            final_text = ev.actions.agent_state["output"]
            break

        # Otherwise keep OVERWRITING with latest content
        if hasattr(ev, "content") and ev.content:
            parts = []
            for part in ev.content.parts:
                if hasattr(part, "text"):
                    parts.append(part.text)
            if parts:
                final_text = "".join(parts)

    output = (final_text or "(no output)").strip()
    return {"output": output}

