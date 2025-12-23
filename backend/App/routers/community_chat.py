from fastapi import WebSocket

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
