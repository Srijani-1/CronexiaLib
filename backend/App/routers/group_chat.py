from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..core.auth import SECRET_KEY, ALGORITHM
from .. import models

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.rooms: dict[int, list[WebSocket]] = {}

    async def connect(self, group_id: int, websocket: WebSocket):
        await websocket.accept()
        self.rooms.setdefault(group_id, []).append(websocket)

    def disconnect(self, group_id: int, websocket: WebSocket):
        if group_id in self.rooms:
            if websocket in self.rooms[group_id]:
                self.rooms[group_id].remove(websocket)
            if not self.rooms[group_id]:
                del self.rooms[group_id]

    async def broadcast(self, group_id: int, message: dict):
        for ws in self.rooms.get(group_id, []):
            await ws.send_json(message)


manager = ConnectionManager()


@router.websocket("/ws/groups/{group_id}")
async def group_chat(websocket: WebSocket, group_id: int):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008)
        return

    db: Session = SessionLocal()

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise JWTError()
    except JWTError:
        await websocket.close(code=1008)
        db.close()
        return

    # Check group
    group = db.get(models.CommunityGroup, group_id)
    if not group:
        await websocket.close(code=1008)
        db.close()
        return

    # Check membership
    member = db.query(models.CommunityGroupMember).filter_by(
        group_id=group_id,
        user_id=int(user_id)
    ).first()

    if not member:
        await websocket.close(code=1008)
        db.close()
        return

    await manager.connect(group_id, websocket)

    try:
        while True:
            data = await websocket.receive_json()

            message = models.CommunityGroupMessage(
                group_id=group_id,
                user_id=int(user_id),
                content = data.get("content")
            )
            db.add(message)
            db.commit()
            db.refresh(message)

            await manager.broadcast(
                group_id,
                {
                    "id": message.id,
                    "content": message.content,
                    "user_id": user_id,
                    "user_name": member.user.full_name,
                    "created_at": message.created_at.isoformat()
                }
            )

    except WebSocketDisconnect:
        manager.disconnect(group_id, websocket)
    finally:
        db.close()
