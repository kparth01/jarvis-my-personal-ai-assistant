import os
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from stt.speech_to_text import SpeechToText
from llm.llm_call import LLMCall
from tts.text_to_speech import TextToSpeech
from api.models.user_message import UserMessage
import shutil, uuid as uuid_lib, os

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
def health():
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
def chat_pipeline(message: UserMessage):
    """Text-only endpoint: send a message, get a text reply."""
    reply_text = llm.generate_response(message.content)
    return JSONResponse(
        content={"role": "assistant", "reply": reply_text}
    )


@app.delete("/context")
def reset_context():
    """Clear the LLM conversation context."""
    llm.context.clear()
    return {"status": "context cleared"}
