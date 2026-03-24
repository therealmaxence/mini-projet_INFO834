from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from chat_manager import chat_manager
import json
import asyncio
import threading
from database import redis_client

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, ws: WebSocket, username: str):
        await ws.accept()
        self.active_connections[username] = ws
        chat_manager.add_user(username)
        await self.broadcast_user_list()

    def disconnect(self, username: str):
        if username in self.active_connections:
            del self.active_connections[username]
        chat_manager.remove_user(username)

    async def broadcast_user_list(self):
        users = chat_manager.get_online_users()
        message = json.dumps({"type": "users", "data": users})
        for connection in self.active_connections.values():
            await connection.send_text(message)

    async def broadcast_message(self, message: dict):
        msg_str = json.dumps({"type": "message", "data": message})
        for connection in self.active_connections.values():
            await connection.send_text(msg_str)

    async def broadcast_event(self, event_type: str, data: dict):
        event_str = json.dumps({"type": event_type, "data": data})
        for connection in self.active_connections.values():
            await connection.send_text(event_str)

    async def send_personal_message(self, message: dict, recipient: str):
        if recipient in self.active_connections:
            msg_str = json.dumps({"type": "message", "data": message})
            await self.active_connections[recipient].send_text(msg_str)

manager = ConnectionManager()

def redis_expiration_listener():
    """Background listener for Redis keyspace expiration events"""
    pubsub = redis_client.pubsub()
    # Subscribe to expiration events for database 0
    pubsub.psubscribe("__keyevent@0__:expired")
    print("Redis expiration listener started")
    
    for message in pubsub.listen():
        if message['type'] == 'pmessage':
            key = message['data']
            if key.startswith("msg_ttl:"):
                msg_id = key.split(":")[1]
                print(f"Message {msg_id} expired, deleting from Mongo")
                chat_manager.delete_message(msg_id)
                # Broadcast deletion to all clients
                try:
                    loop = asyncio.get_event_loop()
                    if loop.is_running():
                        asyncio.run_coroutine_threadsafe(
                            manager.broadcast_event("message_deleted", {"_id": msg_id}),
                            loop
                        )
                except Exception as e:
                    print(f"Error broadcasting deletion for {msg_id}: {e}")

@app.on_event("startup")
async def startup_event():
    # Start the Redis listener in a separate thread
    threading.Thread(target=redis_expiration_listener, daemon=True).start()

@app.websocket("/ws/{username}")
async def websocket_endpoint(websocket: WebSocket, username: str):
    await manager.connect(websocket, username)
    try:
        while True:
            data = await websocket.receive_text()
            data_json = json.loads(data)
            action = data_json.get("action", "send")
            
            if action == "edit":
                msg_id = data_json.get("message_id")
                new_content = data_json.get("content", "")
                
                updated_msg = chat_manager.update_message(msg_id, new_content, username)
                if updated_msg:
                    # Broadcast the edit
                    edit_event = {"type": "message_edited", "data": updated_msg}
                    for connection in manager.active_connections.values():
                        await connection.send_text(json.dumps(edit_event))
                continue
                
            recipient = data_json.get("recipient", "all")
            content = data_json.get("content", "")
            msg_type = data_json.get("msg_type", "text")
            ttl = data_json.get("ttl") # Optional TTL in seconds
            
            saved_msg = chat_manager.save_message(username, content, recipient, msg_type, ttl)
            # Format datetime and ObjectId for JSON
            saved_msg["_id"] = str(saved_msg["_id"])
            saved_msg["timestamp"] = saved_msg["timestamp"].isoformat()
            if "expires_at" in saved_msg:
                saved_msg["expires_at"] = saved_msg["expires_at"].isoformat()

            if recipient == "all" or recipient.startswith("#"):
                await manager.broadcast_message(saved_msg)
            else:
                await manager.send_personal_message(saved_msg, recipient)
                if sender_ws := manager.active_connections.get(username):
                    await sender_ws.send_text(json.dumps({"type": "message", "data": saved_msg}))

    except WebSocketDisconnect:
        manager.disconnect(username)
        await manager.broadcast_user_list()

@app.get("/messages")
def get_history():
    return chat_manager.get_messages()

@app.get("/conversation/{user1}/{user2}")
def get_conversation(user1: str, user2: str):
    return chat_manager.get_conversation(user1, user2)

@app.get("/channels")
def get_channels():
    return chat_manager.get_channels()

@app.post("/channels/{channel_name}")
def create_channel(channel_name: str):
    chat_manager.add_channel(channel_name)
    return {"message": "Channel created"}

@app.get("/channel_messages/{channel_name}")
def get_channel_messages(channel_name: str):
    return chat_manager.get_channel_messages(channel_name)

@app.get("/analytics")
def get_analytics():
    return chat_manager.get_analytics()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
