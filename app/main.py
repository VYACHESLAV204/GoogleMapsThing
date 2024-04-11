import sqlite3
import time
from fastapi import FastAPI
from . import models
from .database import engine
from .routers import chat, front
import logging
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
logging.getLogger("passlib").setLevel(logging.ERROR)
models.Base.metadata.create_all(bind=engine)


while True:
    try:
        conn = sqlite3.connect("your_database.db")
        print("Connection was successfull")
        break
    except Exception as error:
        print("Connection was failed", error)
        time.sleep(3)


app.include_router(chat.router)

app.include_router(front.router)
