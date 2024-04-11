async def save_file(file_content: bytes, file_name: str):

    with open(file_name, "wb") as file:
        file.write(file_content)
