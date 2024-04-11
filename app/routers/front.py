from fastapi import APIRouter
from fastapi.responses import FileResponse, HTMLResponse


router = APIRouter(prefix="/chat/static", tags=["static"])


@router.get("/")
async def get():
    with open("./templates/index.html", "r", encoding="utf-8") as file:
        html_content = file.read()
    return HTMLResponse(content=html_content)


@router.get("/main.js/{id}")
async def get_main_js():
    with open("./templates/main.js", "r") as file:
        html_content = file.read()
    return HTMLResponse(content=html_content)


@router.get("/styles.css")
async def get_index_css():
    with open("./templates/styles.css", "r") as file:
        return FileResponse("./templates/styles.css")


@router.get("/Send-256x256.svg")
async def get_icon():
    return FileResponse("./templates/Send-256x256.svg")


@router.get("/free-icon-add-file-1090923.svg")
async def get_icon():
    return FileResponse("./templates/free-icon-add-file-1090923.svg")
