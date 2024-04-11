from pydantic import BaseModel, EmailStr
from datetime import datetime


class message(BaseModel):
    id: int
    text: str


class FileName(BaseModel):
    filename: str
