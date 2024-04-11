from http.client import HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi import (
    Response,
    WebSocket,
    WebSocketDisconnect,
    status,
    APIRouter,
)
from app.utils.main import save_file
from ..schemas import FileName
from ..web_socket import ClientChatManager, ConnectionManager, AdminConnectionManager
import mimetypes

KEY = "7b70a343259f58b492cd49d9dac4d38c9bb9d2541a98a1ba59d131050867e1c3"
router = APIRouter(prefix="/chat", tags=["Chat"])
manager = ConnectionManager()
admin_manager = AdminConnectionManager(ConnectionManager=manager)
client_chat_manager = ClientChatManager(
    AdminConnectionManager=admin_manager, ConnectionManager=manager
)

current_user_id = None
extension: str = None
file_name: str = None

chats = []


@router.get("/get_chats/{secret_key}")
async def get_chats(secret_key: str):
    if secret_key == KEY:

        global chats
        users = await admin_manager.get_users()  # Get the list of chats
        return JSONResponse(content={"data": users})
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Key is invalid "
        )


@router.get("/set_current_chat/{user_id}/{secret_key}")
async def set_current_chat(user_id: int, secret_key: str):
    if secret_key == KEY:
        global current_user_id
        current_user_id = user_id
        messages = await admin_manager.get_message_story(message_for=current_user_id)
        for message in messages:
            await admin_manager.send_message_to_myself(
                message.message, message_for=current_user_id
            )
        return current_user_id
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Key is invalid "
        )


@router.websocket("/ws/admin/{secret_key}")
async def admin_websocket_endpoint(websocket: WebSocket, secret_key: str):
    await admin_manager.connect_admin(websocket)
    if secret_key == KEY:
        try:
            while True:
                message = await websocket.receive()
                if message["type"] == "websocket.disconnect":
                    break
            if "bytes" in message and message["bytes"] is not None:
                print("bytes")
                await save_file(message["bytes"], file_name=file_name)
                await admin_manager.send_message_to_user(
                    f"Client #{1} uploaded a file: {file_name}",
                    message_for=current_user_id,
                )
            else:

                await admin_manager.send_message_to_user(
                    f"Client #{1} says: {message}", message_for=current_user_id
                )
        except WebSocketDisconnect:
            await admin_manager.disconnect_admin()


@router.websocket("/ws/client/{client_id}")
async def client_websocket_endpoint(websocket: WebSocket, client_id: int):
    global file_name, extension
    await manager.connect_user(websocket, client_id)
    await client_chat_manager.on_connect(client_id)
    try:
        while True:
            message = await websocket.receive()
            if message["type"] == "websocket.disconnect":
                break
            if "bytes" in message and message["bytes"] is not None:
                print("bytes", file_name, extension)
                await save_file(message["bytes"], file_name=file_name)
                await client_chat_manager.send_message_to_admin(
                    f"Client #{client_id} uploaded a file: {file_name}",
                    from_user=client_id,
                    current_user=current_user_id,
                )
            else:
                await client_chat_manager.send_message_to_admin(
                    f"Client #{client_id} says: {message}",
                    from_user=client_id,
                    current_user=current_user_id,
                )
    except WebSocketDisconnect:
        await manager.disconnect_user(client_id)


@router.post("/filename", status_code=status.HTTP_201_CREATED)
def get_file_name(user: FileName):
    global extension, file_name
    file_name = user.filename
    extension = mimetypes.guess_extension(user.filename)


@router.get("/download/{file_name}")
async def download_file(file_name):
    file_path = f"./{file_name}"
    if file_path:
        return FileResponse(
            file_path,
        )
    else:
        return {"error": "File not found"}
