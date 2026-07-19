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
    update_db(message, reply_text, topic)
    return JSONResponse(
        content={"role": "assistant", 
                 "reply": reply_text,
                 "topic": topic}
    )


@app.delete("/context")
async def reset_context():
    """Clear the LLM conversation context."""
    llm.context.clear()
    return {"status": "context cleared"}


@app.get("/chat-history")
async def chat_history():
    """Return the chat history from DB to show on UI"""
    chats = get_chat_history()
    topics: list[str] = []
    
    for chat in chats:
        topics.append(chat["topic"])

    return JSONResponse(content={"topics": topics})


def update_db(message: UserMessage, reply_text: str, topic: str):
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
    
def get_chat_history():
    db = SessionLocal()
    try:
        chats = db.query(Chat).all()
        chatDict = []
        for c in chats:
            chatDict.append({
                "topic": c.topic,
                "session_id": c.session_id
            })
        
        return chatDict
        # return [{"topic": chat.topic, "session_id": chat.session_id} for chat in chats]
    except Exception as e:
        logger.error(f"Error occured while fetching chat history {e}")
    finally:
        db.commit()
        db.close()