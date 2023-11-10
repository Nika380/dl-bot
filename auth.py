import asyncio
from fastapi import HTTPException
from pydantic import BaseModel
from pyrogram import Client
import os

class AuthDetails(BaseModel):
    api_id: str
    api_hash: str
    phone_number: str

async def authenticate_user():
    try:
        app = Client(
            "my_account",
            api_id=os.getenv("APP_ID"),
            api_hash=os.getenv("APP_HASH")
        )
        await app.start()

        if not app.is_connected:
            await app.send_code(os.getenv("PHONE_NUMBER"))
            await app.sign_in(os.getenv("PHONE_NUMBER"), input("Enter the code: "))

        await app.stop()
        return {"status": "Authentication Successful"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def main():
    await authenticate_user()

if __name__ == '__main__':
    asyncio.run(main())
