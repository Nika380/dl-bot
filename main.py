from pydantic import BaseModel
from telethon.sync import TelegramClient
from pyrogram import Client
from fastapi import Depends, FastAPI, HTTPException
from fastapi.responses import JSONResponse
import uvicorn
import os

api = FastAPI()
# Replace these with your own values
api_id=os.getenv("APP_ID"),
api_hash=os.getenv("APP_HASH")
phone_number = os.getenv("PHONE_NUMBER")
message = 'Hello, this is a test message!'

# class AuthDetails(BaseModel):
#     api_id: str
#     api_hash: str
#     phone_number: str

# async def authenticate_user():
#     try:
#         app = Client("auth_account", api_id=api_id, api_hash=api_hash)
#         await app.connect()
        
#         if not await app.is_user_authorized():
#             await app.send_code_request(phone_number)
#             await app.sign_in(phone_number, input("Enter the code: "))  # You can replace this with your own code input logic
        
#         await app.disconnect()
#         return {"status": "Authentication Successful"}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

@api.get("/get-dialogues")
async def get_dialogues():
    app = Client("my_account", api_id=api_id, api_hash=api_hash)
    await app.start()

    try:
        # Collect the results from the asynchronous generator
        dialogs = [dialog async for dialog in app.get_dialogs()] # You can adjust the limit as needed
           
           # Convert Dialog objects to dictionaries
        serialized_dialogs = [
               {
                   "id": dialog.chat.id,
                   "title": dialog.chat.title,
                   "firstName": dialog.chat.first_name,
                   # Add other attributes as needed
               }
               for dialog in dialogs
           ]
        return JSONResponse(content={"dialogs": serialized_dialogs})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await app.stop()

class MessageReq(BaseModel):
    text: str
    recipient: str

@api.post('/send-message')
async def send_message(body: MessageReq):
    app = Client("my_account", api_id=api_id, api_hash=api_hash)
    await app.start()

    try: 
        await app.send_message(body.recipient, body.text)
        return JSONResponse(content={"status": "Message Sent Sent Successfully"}, status_code=201)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await app.stop()    


@api.get("/get-contacts")
async def main():
    app = Client("my_account", api_id=api_id, api_hash=api_hash)
    await app.start()
    
    contacts = await app.get_contacts()
    filtered_contacts = [contact for contact in contacts if contact.first_name.startswith('44')]
    
    # Use a set to get unique users based on phone_number
    unique_users = {(contact.first_name, contact.phone_number) for contact in filtered_contacts}

    print(len(unique_users))
    await app.stop()

    return unique_users

if __name__ == '__main__':
    import uvicorn

    # api.include_router(
    #         router=api.router,
    #         dependencies=[Depends(authenticate_user)]
    #     )
    # Run FastAPI using Uvicorn
    uvicorn.run(api, host="127.0.0.1", port=8000)
