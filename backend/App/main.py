from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from passlib.context import CryptContext
from dotenv import load_dotenv
import os
import firebase_admin
from firebase_admin import credentials, initialize_app
from . import models, database
from .routers import (
    login, register, prompt, tools, profile,stats,ai,agent,community,group_chat
)

# ✅ load environment variables early
load_dotenv()

app = FastAPI()

# CORS settings
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://your-frontend-domain.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,     # can set ["*"] for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Initialize Firebase ONCE
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # Directory of main.py
cred_path = os.path.join(BASE_DIR, "firebase-service-account.json")

if os.path.exists(cred_path):
    cred = credentials.Certificate(cred_path)
    try:
        firebase_admin.initialize_app(cred)
    except ValueError:
        # Avoid "default app already exists" error when server reloads
        pass
else:
    print(f"WARNING: Firebase credentials not found at {cred_path}. Firebase features will not work.")

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Custom OpenAPI docs with Bearer auth
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="My API",
        version="1.0.0",
        description="Custom Auth with email",
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }
    for path in openapi_schema["paths"].values():
        for method in path.values():
            method["security"] = [{"BearerAuth": []}]
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to backend!"}

# Register routers
app.include_router(register.router)
app.include_router(login.router)
app.include_router(prompt.router)
app.include_router(tools.router)
app.include_router(agent.router)
app.include_router(profile.router)
app.include_router(stats.router)
app.include_router(ai.router)
app.include_router(community.router)
app.include_router(group_chat.router)
# ✅ Create DB tables if not exist
models.Base.metadata.create_all(bind=database.engine)