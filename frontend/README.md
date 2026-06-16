# J.A.R.V.I.S

TypeScript + Vite frontend. Connects to your local Llama 3.2 backend.

## Setup

```bash
npm install
npm run dev
# opens on http://localhost:5173
```

## Backend contract

Your Python backend must expose one endpoint:

```
POST http://localhost:3000/chat
Content-Type: application/json

{
  "messages": [
    { "role": "system",    "content": "..." },
    { "role": "user",      "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

Response:
```json
{ "reply": "Jarvis response text" }
```

Vite proxies `/api/*` → `localhost:3000` so no CORS issues.
The API call lives entirely in `src/api/client.ts` — swap the URL or auth there.

## Project structure

```
src/
  api/
    client.ts        ← backend call (edit this to swap models)
  components/
    BootScreen.ts    ← intro animation
    HUDScreen.ts     ← main dashboard
  state/
    ChatStore.ts     ← conversation history + send logic
  types/
    index.ts         ← shared types
  main.ts            ← entry point + particle background
  style.css          ← all styles
```

## Extending

- **Add a tool**: add an entry to `TOOLS` array in `HUDScreen.ts`
- **Change persona**: edit `SYSTEM_PROMPT` in `ChatStore.ts`  
- **Add RAG context**: inject retrieved memories into the system prompt in `ChatStore.send()`
- **Stream responses**: change `client.ts` to use `fetch` with `ReadableStream` and update `ChatStore` accordingly
