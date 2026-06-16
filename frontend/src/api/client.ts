import type { Message, ChatResponse } from '../types'

const BASE_URL = '/api'  // proxied to localhost:3000 via vite.config.ts

export async function sendMessage(message: Message): Promise<string> {
  console.log("JSON.stringify(messages): ", JSON.stringify(message))
  const res = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  })

  if (!res.ok) {
    throw new Error(`Backend error: ${res.status} ${res.statusText}`)
  }

  const data: ChatResponse = await res.json()
  return data.reply
}

export async function sendVoiceAudio(audioBlob: Blob): Promise<Blob> {
  const formData = new FormData()
  formData.append('audio', audioBlob, 'recording.wav')

  const res = await fetch(`${BASE_URL}/audio`, {
    method: 'POST',
    body: formData
  })

  if (!res.ok) {
    throw new Error(`Backend error: ${res.status} ${res.statusText}`)
  }

  return await res.blob()
}
