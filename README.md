# Jarvis – Local Voice Agent

A fully local, privacy-first voice assistant built with open-source models. Speak to it, get a spoken reply. No cloud APIs required.

---

## Architecture

```
Browser / React UI
        │
        ▼
  FastAPI Backend  ──► STT (faster-whisper)  ──► transcript
        │
        ▼
  LLM (Ollama / Qwen)
        │  ├──► Tool: SearXNG web search
        │  ├──► Tool: File read / write / delete
        │  └──► Tool: Calculator (add, subtract, multiply, divide)
        │
        ▼
  TTS (Coqui TTS / Tacotron2)
        │
        ▼
   audio/wav  ──► Browser plays it back
```

All components run locally. SearXNG is the only outbound dependency and is also self-hosted.

---

## Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI (Python) |
| Speech-to-Text | [faster-whisper](https://github.com/SYSTRAN/faster-whisper) – Whisper `base` model |
| LLM | [Ollama](https://ollama.com) — Qwen 3.5 9B (primary), Qwen 2.5 7B (topic gen), Gemma 4 (response synthesis) |
| Text-to-Speech | [Coqui TTS](https://github.com/coqui-ai/TTS) – Tacotron2-DDC |
| Web Search | [SearXNG](https://searxng.org) (self-hosted, port 8888) |
| Database | PostgreSQL via SQLAlchemy + Alembic |
| Frontend | React + Vite + Material UI |

---

## Pipeline Flow

### Voice endpoint (`POST /audio`)
1. Upload `.wav` audio
2. faster-whisper transcribes it to text
3. Qwen generates a reply (with optional tool calls)
4. Coqui TTS synthesises the reply to audio
5. `.wav` file returned to the browser

### Chat endpoint (`POST /chat`)
1. Send a text message with a `session_id`
2. Qwen generates a reply (with optional tool calls)
3. Conversation and auto-generated topic saved to Postgres
4. JSON reply returned to the frontend

---

## Tool Calling

The LLM can invoke tools mid-response. Tool results are fed back into context and a final clean summary is produced by Gemma 4.

| Tool | Description |
|---|---|
| `search_searXNG` | Web search via self-hosted SearXNG |
| `write_file` | Create and write a file |
| `append_file` | Append text to an existing file |
| `read_file` | Read a file |
| `delete_file` | Delete a file |
| `add / subtract / multiply / divide` | Arithmetic |

---

## Setup

### Prerequisites

- Python 3.10+
- Node 18+
- [Ollama](https://ollama.com) running locally with the required models pulled
- PostgreSQL running with a `jarvis` schema
- [SearXNG](https://searxng.org) running on port `8888`

### Pull Ollama models

```bash
ollama pull qwen2.5:7b
ollama pull qwen2.5-coder:14b
ollama pull gemma4
```

### Backend

```bash
pip install faster-whisper TTS requests python-multipart fastapi uvicorn sqlalchemy alembic psycopg2-binary ollama

cd app
alembic upgrade head          # run DB migrations
uvicorn main:app --reload     # start API on port 8000
```

### Frontend

```bash
cd frontend-simple/jarvis-ui
npm install
npm run dev                   # starts on port 5173
```

### Open browser (CORS-disabled mode for local dev)

```bash
open -na "Google Chrome" --args --disable-web-security --disable-site-isolation-trials --user-data-dir="/tmp/chrome_dev_session"
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/audio` | Voice pipeline – upload wav, get wav back |
| `POST` | `/chat` | Text chat with session persistence |
| `DELETE` | `/context` | Clear in-memory LLM conversation context |
| `GET` | `/chat-history` | List all chat topics |
| `POST` | `/chat-history-messages` | Fetch messages for a session |

---

## Database

Managed with Alembic. Migrations live in `app/db/migrations/`.

```
chats (schema: jarvis)
  id           INTEGER  PK
  session_id   VARCHAR  UNIQUE
  topic        VARCHAR
  messages     TEXT     (JSON array of role/content pairs)
  created_at   DATETIME
```

---

## Project Structure

```
VoiceAgent/
├── app/
│   ├── main.py                  # FastAPI app & route handlers
│   ├── stt/speech_to_text.py    # faster-whisper wrapper
│   ├── tts/text_to_speech.py    # Coqui TTS wrapper
│   ├── llm/
│   │   ├── llm_call.py          # Main LLM orchestration & tool loop
│   │   ├── qwen_handler.py      # Response parser for Qwen models
│   │   └── default_handler.py   # Fallback response parser
│   ├── tools/
│   │   ├── web_search.py        # SearXNG integration
│   │   ├── file_ops.py          # File read/write/delete
│   │   └── calculator.py        # Arithmetic tools
│   ├── db/
│   │   ├── database.py          # SQLAlchemy engine & session
│   │   ├── models.py            # ORM models
│   │   └── migrations/          # Alembic migration versions
│   └── api/models/
│       └── user_message.py      # Pydantic request model
├── frontend-simple/jarvis-ui/   # React + MUI chat UI
│   └── src/
│       ├── App.jsx
│       ├── components/
│       │   ├── Chat.tsx
│       │   └── layouts/
│       └── types/
└── frontend/                    # Original TypeScript HUD frontend
```
