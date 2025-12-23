from sqlalchemy.orm import Session
from .. import schemas, models
from google.adk.agents import Agent
from google.adk.models.lite_llm import LiteLlm
from google.adk.runners import Runner, RunConfig, InMemorySessionService
import uuid
import asyncio
import re

class UserMessage:
    def __init__(self, content: str):
        self.role = "user"
        self.parts = [{"text": content}]

def create_agent(
    db: Session,
    user_id: int,
    creator_name: str,
    payload: schemas.AgentCreate
) -> models.Agent:

    agent = models.Agent(
        title=payload.title,
        description=payload.description,
        system_prompt=payload.system_prompt,
        model=payload.model,
        temperature=payload.temperature,
        max_tokens=payload.max_tokens,
        visibility=payload.visibility,
        created_by=user_id,
        creator_name=creator_name,
        tags=payload.tags,
        instructions=payload.instructions,
    )

    db.add(agent)
    db.flush()  # get agent.id

    for tool in payload.tools:
        standalone_tool_id = None
        if tool.save_to_library:
            new_tool = models.Tool(
                title=tool.name,
                description=tool.description,
                content=tool.code,
                created_by=user_id,
                creator_name=creator_name,
                tags=payload.tags,
            )
            db.add(new_tool)
            db.flush()
            standalone_tool_id = new_tool.id

        db.add(models.AgentTool(
            agent_id=agent.id,
            name=tool.name,
            description=tool.description,
            code=tool.code,
            enabled=tool.enabled,
            tool_id=standalone_tool_id,
        ))

    for prompt in payload.prompts:
        standalone_prompt_id = None
        if prompt.save_to_library:
            new_prompt = models.Prompt(
                title=f"Prompt from {agent.title}",
                description=f"Automated prompt extraction from {agent.title}",
                content=prompt.content,
                created_by=user_id,
                creator_name=creator_name,
                tags=payload.tags,
            )
            db.add(new_prompt)
            db.flush()
            standalone_prompt_id = new_prompt.id

        db.add(models.AgentPrompt(
            agent_id=agent.id,
            role=prompt.role,
            content=prompt.content,
            order=prompt.order,
            prompt_id=standalone_prompt_id,
        ))

    db.commit()
    db.refresh(agent)
    return agent

def clone_agent(db: Session, agent: models.Agent, user_id: int, creator_name: str):
    clone = models.Agent(
        name=f"{agent.name} (Clone)",
        description=agent.description,
        system_prompt=agent.system_prompt,
        model=agent.model,
        temperature=agent.temperature,
        max_tokens=agent.max_tokens,
        visibility="private",
        created_by=user_id,
        creator_name=creator_name,
        instructions=agent.instructions,
    )

    db.add(clone)
    db.flush()

    for tool in agent.tools:
        db.add(models.AgentTool(
            agent_id=clone.id,
            tool_id=tool.tool_id,
            enabled=tool.enabled,
            config=tool.config,
        ))

    for prompt in agent.prompts:
        db.add(models.AgentPrompt(
            agent_id=clone.id,
            prompt_id=prompt.prompt_id,
            role=prompt.role,
            order=prompt.order,
        ))

    db.commit()
    db.refresh(clone)
    return clone

async def run_agent(db: Session, agent_id: int, user_input: str):
    agent_db = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if not agent_db:
        return None

    return await _execute_agent(
        title=agent_db.title,
        model_name=agent_db.model,
        system_prompt=agent_db.system_prompt,
        prompts=agent_db.prompts,
        user_input=user_input,
        agent_id=agent_db.id
    )

async def test_agent(db: Session, payload: schemas.AgentTestRequest):
    # Resolve library items for testing
    resolved_prompts = []
    for p in payload.config.prompts:
        if p.prompt_id and not p.content:
            lib_p = db.query(models.Prompt).filter(models.Prompt.id == p.prompt_id).first()
            if lib_p:
                resolved_prompts.append(models.AgentPrompt(
                    role=p.role,
                    content=lib_p.content,
                    order=p.order
                ))
        else:
            resolved_prompts.append(models.AgentPrompt(
                role=p.role,
                content=p.content,
                order=p.order
            ))

    return await _execute_agent(
        title=payload.config.title,
        model_name=payload.config.model,
        system_prompt=payload.config.system_prompt,
        prompts=resolved_prompts,
        user_input=payload.input
    )

async def _execute_agent(title: str, model_name: str, system_prompt: str, prompts: list, user_input: str, agent_id: int = None):
    model = LiteLlm(model=model_name or "gpt-4o-mini")
    
    # Concatenate all system prompts
    full_system_prompt = system_prompt or ""
    
    # Sort prompts by order
    sorted_prompts = sorted(prompts, key=lambda p: p.order)
    
    for p in sorted_prompts:
        if p.role == "system":
            full_system_prompt += f"\n{p.content}"
    
    # Sanitize agent name
    safe_name = re.sub(r'[^a-zA-Z0-9_]', '_', title)
    if not safe_name or (not safe_name[0].isalpha() and safe_name[0] != '_'):
        safe_name = 'agent_' + safe_name if safe_name else 'agent'
    
    adk_agent = Agent(
        name=safe_name,
        model=model,
        description=full_system_prompt or "You are a helpful AI assistant."
    )
    
    session_service = InMemorySessionService()
    runner = Runner(
        app_name="AgentHub",
        agent=adk_agent,
        session_service=session_service
    )

    session_id = str(uuid.uuid4())
    await session_service.create_session(
        session_id=session_id,
        app_name="AgentHub",
        user_id="default_user"
    )
    
    config = RunConfig()
    output = ""

    async for ev in runner.run_async(
        user_id="default_user",
        session_id=session_id,
        new_message=UserMessage(user_input),
        run_config=config,
    ):
        # Extract model response text
        if hasattr(ev, "model_response") and ev.model_response:
            for part in getattr(ev.model_response, "parts", []):
                if hasattr(part, "text"):
                    output += part.text
        
        # Extract from content fallback (often used in ADK events)
        if hasattr(ev, "content") and ev.content:
            for part in getattr(ev.content, "parts", []):
                if hasattr(part, "text"):
                    output += part.text
                elif isinstance(part, dict) and "text" in part:
                    output += part["text"]

    return {
        "agent_id": agent_id,
        "title": title,
        "output": output or "(no output)"
    }
