export type Role = 'user' | 'assistant' | 'system'

export interface Message {
  role: Role
  content: string
  timestamp: number
  sessionId?: string
}

export interface ChatResponse {
  reply: string,
  topic: []
}

export interface ChatHistory {
  topics: []
}

export interface ChatMsgHistory {
  topic: string,
  messages: []
  session_id: string
}