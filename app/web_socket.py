from fastapi import WebSocket
from .models import Message
from fastapi.websockets import WebSocket
from sqlalchemy import insert
from app.database import SessionLocal


class ConnectionManager:
    def __init__(self):
        self.user_connections = {}

    async def connect_user(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.user_connections[user_id] = websocket

    async def disconnect_user(self, user_id: int):
        if user_id in self.user_connections:
            del self.user_connections[user_id]


class AdminConnectionManager:
    def __init__(self, ConnectionManager: ConnectionManager):
        self.admin_connection = None
        self.user_connections = ConnectionManager.user_connections

    async def connect_admin(
        self,
        websocket: WebSocket,
    ):
        await websocket.accept()
        self.admin_connection = websocket

    async def disconnect_admin(
        self,
    ):
        del self.admin_connection

    async def get_users(self):
        return list(self.user_connections.keys())

    async def add_message_to_database(self, message: str, client_id: int):
        with SessionLocal() as session:
            stmt = insert(Message).values(
                message=message, chat_id=client_id, id_from_cookie=client_id
            )
            session.execute(stmt)
            session.commit()

    async def get_message_story(self, message_for: int):
        with SessionLocal() as session:
            messages = (
                session.query(Message).filter(Message.chat_id == message_for).all()
            )
        return messages

    async def send_message_to_myself(self, message: str, message_for: int):
        if self.admin_connection != None:
            await self.add_message_to_database(message, client_id=message_for)
            await self.admin_connection.send_text(message)

    async def send_message_to_user(self, message: str, message_for: int):
        await self.send_message_to_myself(message, message_for)
        for user_id, connection in list(self.user_connections.items()):
            if user_id == message_for and connection != None:
                await connection.send_text(message)


class ClientChatManager:
    def __init__(
        self,
        AdminConnectionManager: AdminConnectionManager,
        ConnectionManager: ConnectionManager,
    ):
        self.admin_connection_manager = AdminConnectionManager
        self.user_connections = ConnectionManager

    async def send_message_to_myself(self, message: str, from_user: int):
        await self.admin_connection_manager.add_message_to_database(message, from_user)
        for user_id, connection in list(self.user_connections.user_connections.items()):
            if user_id == from_user and connection != None:
                await connection.send_text(message)

    async def on_connect(self, client_id: int):
        with SessionLocal() as session:
            messages = session.query(Message).filter(Message.chat_id == client_id).all()
        for message in messages:
            await self.user_connections.user_connections[client_id].send_text(
                message.message
            )

    async def send_message_to_admin(
        self, message: str, from_user: int, current_user: int
    ):
        await self.send_message_to_myself(
            message,
            from_user,
        )
        if (
            self.admin_connection_manager.admin_connection != None
            and from_user == current_user
        ):
            await self.admin_connection_manager.admin_connection.send_text(message)
