export type Role = 'user' | 'assistant' | 'system'

export interface Message {
  role: Role
  content: string
  timestamp: number
}

export interface ChatResponse {
  reply: string
}

export type AppScreen = 'boot' | 'hud'

export interface VitalMetric {
  id: string
  label: string
  value: number
  min: number
  max: number
}

export interface Tool {
  id: string
  name: string
  active: boolean
  ping?: string
}
