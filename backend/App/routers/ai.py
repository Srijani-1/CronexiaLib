from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..core.auth import get_current_user
import uuid
from google.adk.runners import RunConfig
from ..agents.tool_runner_agent import runner, session_service

router = APIRouter(prefix="/ai", tags=["AI"])

class UserMessage:
    def __init__(self, content: str):
        self.role = "user"
        self.parts = [{"text": content}]

@router.post("/generate-installation-steps")
async def generate_installation_steps(payload: dict):
    user_prompt = (
        "Based on the code provided below, write clear step-by-step installation "
        "and integration instructions for a developer.\n\n"
        f"Title: {payload.get('title')}\n"
        f"Description: {payload.get('description')}\n"
        f"Language: {payload.get('language')}\n"
        f"Version: {payload.get('version')}\n\n"
        f"Code:\n{payload.get('content')}\n"
    )

    session_id = str(uuid.uuid4())

    await session_service.create_session(
        session_id=session_id,
        app_name="AgentHub",
        user_id="default_user"
    )

    config = RunConfig()
    message = UserMessage(user_prompt)

    output = ""

    async for ev in runner.run_async(
        user_id="default_user",
        session_id=session_id,
        new_message=message,
        run_config=config
    ):
        if hasattr(ev, "content") and ev.content:
            for part in ev.content.parts:
                if hasattr(part, "text"):
                    output += part.text

    if not output:
        output = "(no output)"

    return {"output": output}
    
@router.post("/generate-agent-instructions")
async def generate_agent_instructions(payload: dict):
    user_prompt = (
        "As an expert technical writer, generate comprehensive setup and usage instructions for the following AI Agent.\n\n"
        "The instructions MUST include:\n"
        "1. **Overview**: A brief explanation of what the agent does.\n"
        "2. **Setup & Prerequisites**: Any environment variables or dependencies needed.\n"
        "3. **File Structure**: A recommended directory layout for a project using this agent (e.g., using a backticks block).\n"
        "4. **Configuration**: What extra files (e.g., .env, config.json) the user needs to create and where to put them.\n"
        "5. **Usage Guide**: Step-by-step instructions on how to initialize and interact with the agent.\n"
        "6. **Capabilities**: Specific details on when and how to leverage the associated tools and prompts listed below.\n\n"
        "AGENT CONFIGURATION:\n"
        f"- Title: {payload.get('title')}\n"
        f"- Description: {payload.get('description')}\n"
        f"- Target Model: {payload.get('model')}\n"
        f"- System Role: {payload.get('system_prompt')}\n"
        f"- Tags: {payload.get('tags', [])}\n"
        f"- Tools Available: {payload.get('tools', 'No specific tools listed')}\n"
        f"- Prompts Included: {payload.get('prompts', 'No additional prompts listed')}\n"
    )

    session_id = str(uuid.uuid4())

    await session_service.create_session(
        session_id=session_id,
        app_name="AgentHub",
        user_id="default_user"
    )

    config = RunConfig()
    message = UserMessage(user_prompt)

    output = ""

    async for ev in runner.run_async(
        user_id="default_user",
        session_id=session_id,
        new_message=message,
        run_config=config
    ):
        if hasattr(ev, "content") and ev.content:
            for part in ev.content.parts:
                if hasattr(part, "text"):
                    output += part.text

    if not output:
        output = "(no output)"

    return {"output": output}
