import datetime
from .database import Base
from sqlalchemy import BLOB, Column, Integer, String, Boolean, TIMESTAMP, text


class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, nullable=False)
    message = Column(String)
    createdAt = Column(TIMESTAMP, default=datetime.datetime.now)
    chat_id = Column(Integer, nullable=False)
    id_from_cookie = Column(Integer, nullable=False)

    def as_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}
