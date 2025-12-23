from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from pydantic import ConfigDict
from pydantic import Field

class UserBase(BaseModel):
    full_name : str
    email : str
    phone : str

class UserCreate(UserBase):
    password : str

def decrypt(value: str) -> str:
    return value  

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone: str

    model_config = ConfigDict(from_attributes=True)

class UserProfile(BaseModel):
    id: int
    full_name: str
    email: str
    phone: str
    bio: str | None = ""
    website: str | None = ""
    joined_date: datetime
    profile_image: str | None = ""

    model_config = ConfigDict(from_attributes=True)

class UserProfileUpdate(BaseModel):
    full_name: str
    bio: str
    location: str
    website: str
    phone: str
    profile_image: str | None = ""

class UserLogin(BaseModel):
    identifier : str
    password : str

class Token(BaseModel):
    access_token : str
    token_type : str

class TokenData(BaseModel):
    identifier : Optional[str] = None

class PromptBase(BaseModel):
    title: str
    description: str
    content: str
    tags: Optional[List[str]] = None
    category: Optional[str] = None
    recommended_model: Optional[str] = None


class PromptCreate(PromptBase):
    pass

class PromptResponse(PromptBase):
    id: int
    downloads: Optional[str] = None
    likes: Optional[int] = None
    views: Optional[int] = None
    created_at: datetime
    created_by: int
    creator_name: str
    model_config = ConfigDict(from_attributes=True)
    
class PromptListResponse(BaseModel):
    data: List[PromptResponse]
    total_pages: int

class PromptUpdate(PromptBase):
    pass

class ToolBase(BaseModel):
    title: str
    description: str
    tags: Optional[List[str]] = None
    recommended_model: Optional[str] = None
    content: str
    language: Optional[str] = None
    version: Optional[str] = None
    instructions: Optional[str] = None

class ToolCreate(ToolBase):
    pass

class ToolUpdate(ToolBase):
    pass

class ToolResponse(ToolBase):
    id: int
    downloads: Optional[str] = None
    likes: Optional[int] = None
    views: Optional[int] = None
    created_at: datetime
    created_by: int
    creator_name: str
    model_config = ConfigDict(from_attributes=True)

# Response wrapper for list endpoint
class ToolListResponse(BaseModel):
    data: List[ToolResponse]
    total_pages: int

class AgentRunRequest(BaseModel):
    agent: str
    input: str

class ToolInstructionGenerate(BaseModel):
    title: str
    description: str
    code: str
    language: Optional[str] = None

class AgentRunResponse(BaseModel):
    output: str

class AgentToolCreate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    code: Optional[str] = None
    enabled: bool = True
    save_to_library: bool = False
    tool_id: Optional[int] = None
    config: Optional[dict] = None

class AgentPromptCreate(BaseModel):
    role: str = Field(..., pattern="^(system|user|assistant)$")
    content: Optional[str] = None
    order: int
    save_to_library: bool = False
    prompt_id: Optional[int] = None

class AgentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    system_prompt: str

    model: str
    temperature: float = 0.7
    max_tokens: int = 2000

    visibility: str = Field("public", pattern="^(public|private|unlisted)$")
    tags: Optional[List[str]] = None
    instructions: Optional[str] = None
    tools: List[AgentToolCreate] = []
    prompts: List[AgentPromptCreate] = []

class AgentUpdate(AgentCreate):
    pass

class AgentTestRequest(BaseModel):
    config: AgentCreate
    input: str

class AgentToolRead(BaseModel):
    id: int
    enabled: bool
    display_name: str | None = None
    display_description: str | None = None
    display_code: str | None = None
    tool_id: int | None = None
    config: dict | None = None

    model_config = ConfigDict(from_attributes=True)


class AgentPromptRead(BaseModel):
    id: int
    role: str
    order: int
    content: str
    prompt_id: int | None = None
    model_config = ConfigDict(from_attributes=True)

class AgentRead(BaseModel):
    id: int
    title: str
    description: Optional[str]
    system_prompt: str

    model: str
    temperature: float
    max_tokens: int
    visibility: str
    instructions: Optional[str] = None
    tags: Optional[List[str]] = None
    likes: int = 0
    views: int

    created_at: datetime
    created_by: int
    creator_name: Optional[str]

    tools: List[AgentToolRead]
    prompts: List[AgentPromptRead]

    model_config = ConfigDict(from_attributes=True)

class AgentCard(BaseModel):
    id: int
    title: str
    description: Optional[str]
    model: str
    likes: int = 0
    views: int
    visibility: str

    model_config = ConfigDict(from_attributes=True)

class AgentListResponse(BaseModel):
    data: List[AgentCard]
    total_pages: int

class CommunityGroupCreate(BaseModel):
    name: str
    description: str
    category: str

class CommunityDiscussionCreate(BaseModel):
    title: str
    content: str
    category: str
    tags: Optional[List[str]] = []

class CommunityGroupUpdate(BaseModel):
    name: str
    description: str
    category: str

class CommunityDiscussionResponse(BaseModel):
    id: int
    title: str
    content: str
    category: str
    tags: List[str] | None = []
    likes: int = 0
    comments_count: int
    created_at: datetime
    created_by: int
    creator_name: str

    model_config = ConfigDict(from_attributes=True)

class CommunityGroupResponse(BaseModel):
    id: int
    name: str
    description: str
    category: str
    members_count: int

    model_config = ConfigDict(from_attributes=True)

class CommunityDiscussionListResponse(BaseModel):
    data: List[CommunityDiscussionResponse]
    page: int
    limit: int
    total: int

class CommunityGroupListResponse(BaseModel):
    data: List[CommunityGroupResponse]
    page: int
    limit: int
    total: int


class CommunityGroupMemberResponse(BaseModel):
    id: int
    full_name: str
    role: str
    joined_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CommunityGroupDetailResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    category: str
    owner_name: str
    members: List[CommunityGroupMemberResponse]


class JoinGroupResponse(BaseModel):
    message: str

class CommunityCommentCreate(BaseModel):
    # discussion_id: int
    content: str

class CommunityCommentResponse(BaseModel):
    id: int
    content: str
    user_name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CommunityDiscussionDetailResponse(BaseModel):
    id: int
    title: str
    content: str
    category: str
    tags: List[str]
    creator_name: str
    created_at: datetime
    likes: int = 0
    comments_count: int
    comments: List[CommunityCommentResponse]

    model_config = ConfigDict(from_attributes=True)

