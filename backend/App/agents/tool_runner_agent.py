from google.adk.agents import Agent
from google.adk.models.lite_llm import LiteLlm
from google.adk.runners import Runner, RunConfig, InMemorySessionService

def create_tool_runner_agent():
    """
    Creates an agent that simulates/explains tool behavior.
    Uses description instead of instructions (ADK requirement).
    """
    agent = Agent(
        name="tool_runner",
        model=LiteLlm(model="gpt-4o-mini"),
        description=(
            "You are a helpful assistant that simulates and explains how tools work. "
            "When given code for a tool, you should:\n"
            "1. Analyze what the code does\n"
            "2. Explain its functionality clearly\n"
            "3. Show example output or simulate its behavior\n"
            "4. Be concise but informative\n\n"
            "Always provide a response explaining the tool."
        )
    )
    return agent
tool_runner_agent = create_tool_runner_agent()

session_service = InMemorySessionService()

# Create the runner bound to this agent
runner = Runner(
    app_name="AgentHub",
    agent=tool_runner_agent,
    session_service=session_service
)


