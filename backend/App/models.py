from sqlalchemy import Column, Integer, String, Text, DateTime, func,ForeignKey, Float, Boolean, UniqueConstraint
from .database import Base
from sqlalchemy.orm import relationship
from datetime import datetime
from sqlalchemy import JSON

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(256), nullable=False)
    email = Column(String(256), nullable=False)
    hashed_password = Column(String, nullable=False)
    phone = Column(String(16), nullable=True)
    bio = Column(String, default="")
    website = Column(String, default="")
    joined_date = Column(DateTime(timezone=True), server_default=func.now())
    profile_image = Column(String, default="")
    prompts = relationship("Prompt", back_populates="creator")
    tools = relationship("Tool", back_populates="creator")

class Prompt(Base):
    __tablename__ = "prompts"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(256), nullable=False)
    description = Column(Text, nullable=True)
    content = Column(Text, nullable=False)
    tags = Column(JSON, nullable=True)
    category = Column(String(128), nullable=True)
    recommended_model = Column(String, nullable=True)
    likes = Column(Integer, nullable=True, default=0)
    views = Column(Integer, default=0)
    downloads = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    creator_name = Column(String(256), nullable=True)
    creator = relationship("User", back_populates="prompts")


class Tool(Base):
    __tablename__ = "tools"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(256), nullable=False, index=True)
    description = Column(Text, nullable=True)
    tags = Column(JSON, nullable=True)
    recommended_model = Column(String, nullable=True)
    content = Column(Text, nullable=True)
    language = Column(String(64), nullable=True)
    version = Column(String(64), nullable=True)
    downloads = Column(String(64), nullable=True)
    likes = Column(Integer, nullable=True, default=0)
    views = Column(Integer, default=0)
    instructions = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    creator_name = Column(String(256), nullable=True)
    creator = relationship("User", back_populates="tools")

class LikedPrompt(Base):
    __tablename__ = "liked_prompts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    prompt_id = Column(Integer, ForeignKey("prompts.id"), nullable=False)
    liked_at = Column(DateTime(timezone=True), server_default=func.now())

class LikedTool(Base):
    __tablename__ = "liked_tools"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tool_id = Column(Integer, ForeignKey("tools.id"), nullable=False)
    liked_at = Column(DateTime(timezone=True), server_default=func.now())

class PromptView(Base):
    __tablename__ = "prompt_views"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    prompt_id = Column(Integer, ForeignKey("prompts.id"), nullable=False)
    viewed_at = Column(DateTime(timezone=True), server_default=func.now())

class ToolView(Base):
    __tablename__ = "tool_views"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tool_id = Column(Integer, ForeignKey("tools.id"), nullable=False)
    viewed_at = Column(DateTime(timezone=True), server_default=func.now())


class LikedAgent(Base):
    __tablename__ = "liked_agents"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=False)
    liked_at = Column(DateTime(timezone=True), server_default=func.now())

class AgentView(Base):
    __tablename__ = "agent_views"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=False)
    viewed_at = Column(DateTime(timezone=True), server_default=func.now())

class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(256), nullable=False)
    description = Column(Text, nullable=True)

    system_prompt = Column(Text, nullable=True)  
    # High-level instruction for the agent
    tags = Column(JSON, nullable=True)
    model = Column(String(128), nullable=True)
    temperature = Column(Float, nullable=True)
    max_tokens = Column(Integer, nullable=True)
    instructions = Column(Text, nullable=True)

    visibility = Column(String(32), default="public")
    # public | private | unlisted

    likes = Column(Integer, default=0)
    views = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    creator_name = Column(String(256), nullable=True)

    creator = relationship("User")
    tools = relationship("AgentTool", back_populates="agent")
    prompts = relationship("AgentPrompt", back_populates="agent")

class AgentTool(Base):
    __tablename__ = "agent_tools"

    id = Column(Integer, primary_key=True)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=False)
    name = Column(String(256), nullable=False)
    description = Column(Text, nullable=True)
    code = Column(Text, nullable=True)
    enabled = Column(Boolean, default=True)
    tool_id = Column(Integer, ForeignKey("tools.id"), nullable=True)

    # Optional per-tool config
    config = Column(JSON, nullable=True)

    agent = relationship("Agent", back_populates="tools")
    tool = relationship("Tool")

    @property
    def display_name(self):
        return self.tool.title if self.tool else self.name

    @property
    def display_description(self):
        return self.tool.description if self.tool else self.description

    @property
    def display_code(self):
        return self.tool.content if self.tool else self.code

class AgentPrompt(Base):
    __tablename__ = "agent_prompts"

    id = Column(Integer, primary_key=True)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=False)
    order = Column(Integer, nullable=False)
    content = Column(Text, nullable=True)
    prompt_id = Column(Integer, ForeignKey("prompts.id"), nullable=True)

    role = Column(String(64), default="user")
    # system | user | assistant | example

    order = Column(Integer, default=0)

    agent = relationship("Agent", back_populates="prompts")
    prompt = relationship("Prompt")

class AgentRun(Base):
    __tablename__ = "agent_runs"

    id = Column(Integer, primary_key=True)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    input = Column(Text, nullable=True)
    output = Column(Text, nullable=True)

    status = Column(String(32), default="completed")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CommunityDiscussion(Base):
    __tablename__ = "community_discussions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(256), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(32), nullable=False)  # prompts | tools | agents | general
    tags = Column(JSON, nullable=True)

    likes = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    comments = relationship("CommunityComment",backref="discussion",cascade="all, delete-orphan")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    creator = relationship("User")

class CommunityComment(Base):
    __tablename__ = "community_comments"

    id = Column(Integer, primary_key=True)
    discussion_id = Column(Integer, ForeignKey("community_discussions.id"))
    user_id = Column(Integer, ForeignKey("users.id"))

    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")


class CommunityGroup(Base):
    __tablename__ = "community_groups"

    id = Column(Integer, primary_key=True)
    name = Column(String(256), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(32), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner = relationship("User")
    members = relationship(
        "CommunityGroupMember",
        back_populates="group",
        cascade="all, delete-orphan"
    )

class CommunityGroupMember(Base):
    __tablename__ = "community_group_members"

    id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey("community_groups.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    role = Column(String(20), default="member")  
    # member | admin | owner
    __table_args__ = (UniqueConstraint("group_id", "user_id", name="uq_group_user"),)

    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    group = relationship("CommunityGroup", back_populates="members")



class CommunityLike(Base):
    __tablename__ = "community_likes"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    discussion_id = Column(Integer, ForeignKey("community_discussions.id"))

class CommunityGroupMessage(Base):
    __tablename__ = "community_group_messages"

    id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey("community_groups.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")

