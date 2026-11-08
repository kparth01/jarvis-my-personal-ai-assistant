import os
import json
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from stt.speech_to_text import SpeechToText
from llm.llm_call import LLMCall
from tts.text_to_speech import TextToSpeech
from api.models.user_message import UserMessage
import shutil, uuid as uuid_lib, os
from db.database import SessionLocal
from db.models import Chat
import logging
import uuid

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="VoiceAgent – Jarvis")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

OUTPUT_DIR = "outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

stt = SpeechToText()
llm = LLMCall()
tts = TextToSpeech()


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/audio")
async def chat(audio: UploadFile = File(...)) -> FileResponse:
    # save incoming audio
    uuid = uuid_lib.uuid4()
    input_path = os.path.join(OUTPUT_DIR, f"request_{uuid}.wav")
    output_path = os.path.join(OUTPUT_DIR, f"response_{uuid}.wav")

    with open(input_path, "wb") as f:
        shutil.copyfileobj(audio.file, f)

    transcript = stt.generate_transcript(input_path)
    response_llm = llm.generate_response(transcript=transcript)
    tts.generate_voice(llm_input=response_llm, output_path=output_path)

    # cleanup input
    os.remove(input_path)

    return FileResponse(output_path, media_type="audio/wav")


@app.post("/chat")
async def chat_pipeline(message: UserMessage):
    """Text-only endpoint: send a message, get a text reply."""
    reply_text, topic = llm.generate_response(message.content)
    update_chat(message, reply_text, topic)
    return JSONResponse(
        content={"role": "assistant", 
                 "reply": reply_text,
                 "topic": topic}
    )


@app.post("/add-new")
async def add_new(message: UserMessage):
    """Add new blank chat when user initializes new chats"""
    chat: Chat = create_chat(message, topic="New Chat")
    return {"status": "New chat created"}


@app.delete("/context")
async def reset_context():
    """Clear the LLM conversation context."""
    llm.context.clear()
    return {"status": "context cleared"}


@app.get("/chat-history")
async def chat_history():
    """Return the chat history from DB to show on UI"""
    chats = get_topics()
    data = []
    for chat in chats:
        data.append({
            "topic": chat["topic"],
            "sessionId": chat["session_id"]
        })
    return JSONResponse(content={"history": data})


@app.post("/chat-history-messages")
async def chat_history(message: UserMessage):
    """Return historic messages for selected chats based on session id"""
    chat_messages_hist = get_chat_history(message.session_id)
    messages_ob = json.loads(chat_messages_hist["messages"])
    return JSONResponse(
        content={
            "topic": chat_messages_hist["topic"],
            "messages": messages_ob,
            "sessionId": chat_messages_hist["session_id"]
        }
    )


def update_chat(message: UserMessage, reply_text: str, topic: str):
    db = SessionLocal()
    try:
        chat = db.query(Chat).filter(Chat.session_id == message.session_id).first()

        new_message = {"role": "user", "content": message.content}
        assistant_message = {"role": "assistant", "content": reply_text}

        if chat is None:
            chat = Chat(
                session_id=message.session_id,
                topic=topic,
                messages=json.dumps([new_message, assistant_message])
            )
            db.add(chat)
            logger.info(f"Creating new chat history with for session_id {message.session_id}")
        else:
            existing = json.loads(chat.messages)
            existing.extend([new_message, assistant_message]) 
            chat.messages = json.dumps(existing)
            logger.info(f"Updating new chat history with for session_id {message.session_id}")

    except Exception as e:
        logger.error(f"Error occured while creating or updating chat history "
        "for session_id {message.session_id}")
    finally:
        db.commit()
        db.close()


def create_chat(message: UserMessage, topic: str) -> Chat:
    db = SessionLocal()

    try:
        session_id = str(uuid.uuid4())
        chat = Chat(
            session_id=session_id,
            topic="",
            messages=""
        )
        db.add(chat)
        logger.info(f"Creating new chat history with for session_id: {session_id}")
        return chat
    except Exception as e:
        logger.error(f"Error occured while creating or updating chat history "
                "for session_id {session_id}")
    finally:
        db.commit()
        db.close()
    
        
    
def get_topics():
    db = SessionLocal()
    try:
        chats = db.query(Chat).all()
        chat_list = []
        for c in chats:
            chat_list.append({
                "topic": c.topic,
                "session_id": c.session_id
            })
        
        return chat_list
        # return [{"topic": chat.topic, "session_id": chat.session_id} for chat in chats]
    except Exception as e:
        logger.error(f"Error occured while fetching chat history {e}")
    finally:
        db.commit()
        db.close()


def get_chat_history(session_id: str):
    db = SessionLocal()
    try:
        chat_messages = db.query(Chat).filter(Chat.session_id == session_id)
        if chat_messages is None:
            return None
        return {
                "topic": chat_messages[0].topic,
                "messages": chat_messages[0].messages,
                "session_id": chat_messages[0].session_id
            }
    except Exception as e:
        logger.error(f"Error occured while fetching chat history {e}")
    finally:
        db.commit()
        db.close()