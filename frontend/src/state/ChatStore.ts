import type { Message } from '../types'
import { sendMessage } from '../api/client'


export class ChatStore {
  private history: Message[] = []
  private onUpdate: (messages: Message[]) => void
  private onTyping: (typing: boolean) => void

  constructor(
    onUpdate: (messages: Message[]) => void,
    onTyping: (typing: boolean) => void
  ) {
    this.onUpdate = onUpdate
    this.onTyping = onTyping

    // seed system prompt (not shown in UI)
  }

  getMessages(): Message[] {
    return this.history.filter(m => m.role !== 'system')
  }

  async send(text: string): Promise<void> {
    const userMsg: Message = {
      role: 'user',
      content: text,
      timestamp: Date.now()
    }
    this.history.push(userMsg)
    this.onUpdate(this.getMessages())
    this.onTyping(true)

    try {
      const reply = await sendMessage(userMsg)
      const assistantMsg: Message = {
        role: 'assistant',
        content: reply,
        timestamp: Date.now()
      }
      this.history.push(assistantMsg);
    } catch (err) {
      const errorMsg: Message = {
        role: 'assistant',
        content: `System error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        timestamp: Date.now()
      }
      this.history.push(errorMsg)
    } finally {
      this.onTyping(false)
      this.onUpdate(this.getMessages())
    }
  }

  clear(): void {
    this.history = [this.history[0]] // keep system prompt
    this.onUpdate(this.getMessages())
  }
}
