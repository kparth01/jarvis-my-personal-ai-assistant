export type Role = 'user' | 'assistant' | 'system'

export interface Message {
  role: Role
  content: string
  timestamp: number
  sessionId?: string
}

export interface ChatResponse {
  reply: string,
  topic: string
}

export interface ChatHistory {
  topics: []
}