import type { Message, VitalMetric, Tool } from '../types'
import { ChatStore } from '../state/ChatStore'
import { sendVoiceAudio } from '../api/client'

const VITALS: VitalMetric[] = [
  { id: 'cpu', label: 'CPU LOAD', value: 34, min: 18, max: 58 },
  { id: 'mem', label: 'MEMORY', value: 61, min: 52, max: 78 },
  { id: 'nn',  label: 'NEURAL NET', value: 88, min: 78, max: 97 },
]

const TOOLS: Tool[] = [
  { id: 'llm',    name: 'Llama 3.2',     active: true,  ping: '—' },
  { id: 'shell',  name: 'Shell exec',     active: true,  ping: 'ready' },
  { id: 'search', name: 'Web search',     active: true,  ping: '—' },
  { id: 'memory', name: 'Vector memory',  active: true,  ping: '1,847' },
  { id: 'voice',  name: 'Voice I/O',      active: false, ping: 'standby' },
  { id: 'cal',    name: 'Calendar',       active: false, ping: 'standby' },
]

const MEMORY_ITEMS = [
  { tag: 'REACH',  text: 'Post 5/30 → 12.2k views' },
  { tag: 'SERIES', text: 'Interviewer · SysD · 30 reels' },
  { tag: 'STACK',  text: 'Java · Spring Boot · 10yr exp' },
  { tag: 'NODE',   text: 'Singapore · @atechjoint' },
  { tag: 'NEXT',   text: 'Checkpoint at post 15/30' },
]

const TICKERS = [
  'SCANNING MEMORY INDEX...',
  'RAG RETRIEVAL ACTIVE...',
  'LLAMA 3.2 BACKEND CONNECTED...',
  'VECTOR DB: 1,847 DOCUMENTS INDEXED...',
  'SHELL EXEC MODULE READY...',
  'AWAITING YOUR COMMAND, PARTH...',
  'POST 15/30 CHECKPOINT APPROACHING...',
  '@ATECHJOINT · SYSTEM DESIGN SERIES · 30 REELS...',
]

export class HUDScreen {
  private el: HTMLElement
  private chatStore: ChatStore
  private arcCtx: CanvasRenderingContext2D | null = null
  private arcPct = 94
  private arcDir = -1
  private sessionSec = 0
  private tickerIdx = 0

  private isRecording = false
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private analyser: AnalyserNode | null = null
  private animFrame: number | null = null

  constructor() {
    this.el = document.createElement('div')
    this.el.id = 'hud'
    this.el.innerHTML = this.template()

    this.chatStore = new ChatStore(
      (msgs) => this.renderMessages(msgs),
      (typing) => this.setTyping(typing)
    )

    this.bindEvents()
    this.initArc()
    this.startTimers()
    this.startVitalFlicker()
  }

  getElement(): HTMLElement { return this.el }

  show(): void { this.el.classList.add('visible') }

  // ── Template ──────────────────────────────────────────────────────────────

  private template(): string {
    return `
      <div class="hud-top">
        <div class="hud-logo">J.A.R.V.I.S</div>
        <div class="hud-status">
          <div class="status-dot"></div>
          <span class="status-txt">ALL SYSTEMS NOMINAL</span>
        </div>
        <div class="hud-clock" id="hud-clock">00:00:00 SGT</div>
      </div>

      <div class="hud-body">
        <div class="panel panel-left">
          <div class="panel-title">System vitals</div>
          ${VITALS.map(v => `
            <div class="vital">
              <div class="vital-label">${v.label}</div>
              <div class="vital-track"><div class="vital-fill" id="${v.id}-fill" style="width:${v.value}%"></div></div>
              <div><span class="vital-val" id="${v.id}-val">${v.value}</span><span class="vital-unit">%</span></div>
            </div>
          `).join('')}
          <div class="arc-wrap">
            <canvas id="arc-canvas" width="90" height="90"></canvas>
            <div class="arc-label">ARC REACTOR</div>
            <div class="arc-pct" id="arc-pct">94%</div>
          </div>
        </div>

        <div class="panel panel-center">
          <div class="panel-title">Active session</div>
          <div class="chat-log" id="chat-log">
            <div class="msg msg-j">
              <div class="msg-who">JARVIS</div>
              Good evening, Parth. All systems nominal. How may I assist?
            </div>
          </div>
          <div class="typing-dots" id="typing-dots" style="display:none">
            <span></span><span></span><span></span>
          </div>
          <div class="chat-input-row">
            <input
              type="text"
              id="chat-input"
              class="chat-input"
              placeholder="Issue a command..."
              autocomplete="off"
            />
            <button id="voice-btn" class="voice-btn">VOICE</button>
            <button id="send-btn" class="send-btn">SEND</button>
          </div>
        </div>

        <div class="panel panel-right">
          <div class="panel-title">Active tools</div>
          ${TOOLS.map(t => `
            <div class="tool-row">
              <div class="tool-dot ${t.active ? 'on' : 'off'}" id="dot-${t.id}"></div>
              <span class="tool-name">${t.name}</span>
              <span class="tool-ping" id="ping-${t.id}">${t.ping ?? ''}</span>
            </div>
          `).join('')}

          <div class="panel-title" style="margin-top:10px">Memory context</div>
          ${MEMORY_ITEMS.map(m => `
            <div class="mem-item">
              <span class="mem-tag">${m.tag}</span>${m.text}
            </div>
          `).join('')}
        </div>
      </div>

      <div class="hud-bottom">
        <span class="hud-node">PARTH · SWE-SENIOR · SGP-NODE-01</span>
        <span class="hud-ticker" id="hud-ticker">SCANNING MEMORY INDEX...</span>
        <span class="hud-session" id="hud-session">SESSION 00:00</span>
      </div>
    `
  }

  // ── Events ────────────────────────────────────────────────────────────────

  private bindEvents(): void {
    const input = this.el.querySelector<HTMLInputElement>('#chat-input')!
    const btn = this.el.querySelector<HTMLButtonElement>('#send-btn')!
    const voiceBtn = this.el.querySelector<HTMLButtonElement>('#voice-btn')!

    const submit = () => {
      const text = input.value.trim()
      if (!text) return
      input.value = ''
      this.chatStore.send(text)
    }

    btn.addEventListener('click', submit)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit()
    })

    voiceBtn.addEventListener('click', () => {
      if (this.isRecording) this.stopRecording()
      else this.startRecording()
    })
  }

  // ── Chat rendering ────────────────────────────────────────────────────────

  private renderMessages(messages: Message[]): void {
    const log = this.el.querySelector<HTMLDivElement>('#chat-log')!
    log.innerHTML = messages.map(m => `
      <div class="msg ${m.role === 'assistant' ? 'msg-j' : 'msg-u'}">
        <div class="msg-who">${m.role === 'assistant' ? 'JARVIS' : 'YOU'}</div>
        ${this.escapeHtml(m.content)}
      </div>
    `).join('')
    log.scrollTop = log.scrollHeight
  }

  private setTyping(typing: boolean): void {
    const dots = this.el.querySelector<HTMLDivElement>('#typing-dots')!
    dots.style.display = typing ? 'flex' : 'none'
  }

  private setVoiceButtonState(recording: boolean): void {
    const btn = this.el.querySelector<HTMLButtonElement>('#voice-btn')!
    btn.textContent = recording ? 'STOP' : 'VOICE'
    btn.classList.toggle('recording', recording)
  }

  private appendSystemMessage(role: 'user' | 'assistant', text: string, audioUrl?: string): void {
    const log = this.el.querySelector<HTMLDivElement>('#chat-log')!
    const message = document.createElement('div')
    message.className = `msg ${role === 'assistant' ? 'msg-j' : 'msg-u'}`

    const who = document.createElement('div')
    who.className = 'msg-who'
    who.textContent = role === 'assistant' ? 'JARVIS' : 'YOU'

    const bubble = document.createElement('div')
    bubble.className = 'msg-content'
    bubble.textContent = text

    message.appendChild(who)
    message.appendChild(bubble)

    if (audioUrl) {
      // Canvas-based sine wave player
      const wrapper = document.createElement('div')
      wrapper.className = 'wave-player'

      const playBtn = document.createElement('button')
      playBtn.className = 'wave-play-btn'
      playBtn.setAttribute('aria-label', 'Play')
      playBtn.innerHTML = '&#9654;'

      const canvas = document.createElement('canvas')
      canvas.className = 'wave-canvas'
      canvas.height = 40

      const timeLabel = document.createElement('span')
      timeLabel.className = 'wave-time'
      timeLabel.textContent = '0:00'

      wrapper.appendChild(playBtn)
      wrapper.appendChild(canvas)
      wrapper.appendChild(timeLabel)
      bubble.appendChild(wrapper)

      const audio = new Audio(audioUrl)

      // Draw waveform — static when paused, animated when playing
      let phase = 0
      let playing = false
      let rafId: number

      const drawWave = () => {
        const W = canvas.width = canvas.offsetWidth || 200
        const H = 40
        const ctx = canvas.getContext('2d')!
        ctx.clearRect(0, 0, W, H)

        const amp = playing ? 10 : 4
        const freq = 0.045

        // primary wave
        ctx.beginPath()
        for (let x = 0; x < W; x++) {
          const y = H / 2 + Math.sin(x * freq + phase) * amp
                          * (1 + 0.35 * Math.sin(x * 0.02 + phase * 0.7))
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.strokeStyle = playing ? 'rgba(0,212,255,0.85)' : 'rgba(0,212,255,0.35)'
        ctx.lineWidth = 1.5
        ctx.stroke()

        // mirror wave
        ctx.beginPath()
        for (let x = 0; x < W; x++) {
          const y = H / 2 - Math.sin(x * freq + phase) * amp * 0.45
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.strokeStyle = playing ? 'rgba(0,212,255,0.3)' : 'rgba(0,212,255,0.12)'
        ctx.lineWidth = 1
        ctx.stroke()

        if (playing) phase += 0.07
        rafId = requestAnimationFrame(drawWave)
      }
      rafId = requestAnimationFrame(drawWave)

      // Sync time label
      audio.addEventListener('timeupdate', () => {
        const s = Math.floor(audio.currentTime)
        timeLabel.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
      })

      // Play / pause toggle
      playBtn.addEventListener('click', () => {
        if (audio.paused) {
          void audio.play()
          playing = true
          playBtn.innerHTML = '&#10074;&#10074;'
        } else {
          audio.pause()
          playing = false
          playBtn.innerHTML = '&#9654;'
        }
      })

      audio.addEventListener('ended', () => {
        playing = false
        playBtn.innerHTML = '&#9654;'
        phase = 0
      })

      // Cleanup canvas loop when audio is GC'd
      audio.addEventListener('emptied', () => cancelAnimationFrame(rafId))

      // Autoplay
      void audio.play().then(() => {
        playing = true
        playBtn.innerHTML = '&#10074;&#10074;'
      }).catch(() => { /* autoplay blocked, user must press play */ })
    }

    log.appendChild(message)
    log.scrollTop = log.scrollHeight
  }

  private async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const ctx = new AudioContext()
      const source = ctx.createMediaStreamSource(stream)
      this.analyser = ctx.createAnalyser()
      this.analyser.fftSize = 64
      source.connect(this.analyser)

      this.mediaRecorder = new MediaRecorder(stream)
      this.audioChunks = []
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.audioChunks.push(e.data)
      }
      this.mediaRecorder.onstop = () => {
        void this.handleAudio(stream)
      }

      this.mediaRecorder.start()
      this.isRecording = true
      this.setVoiceButtonState(true)
      this.animateVoiceWave()
    } catch (err) {
      this.appendSystemMessage('assistant', `Microphone error: ${err instanceof Error ? err.message : 'access denied'}`)
    }
  }

  private stopRecording(): void {
    if (!this.mediaRecorder || !this.isRecording) return
    this.mediaRecorder.stop()
    this.isRecording = false
    this.setVoiceButtonState(false)
    if (this.animFrame) cancelAnimationFrame(this.animFrame)
    if (this.analyser) this.analyser.disconnect()
  }

  private animateVoiceWave(): void {
    if (!this.analyser) return
    const data = new Uint8Array(this.analyser.frequencyBinCount)
    const btn = this.el.querySelector<HTMLButtonElement>('#voice-btn')!

    const draw = () => {
      this.animFrame = requestAnimationFrame(draw)
      this.analyser!.getByteFrequencyData(data)
      const intensity = Math.min(1, data[0] / 128)
      btn.style.boxShadow = `0 0 ${4 + intensity * 10}px rgba(0,212,255,${0.2 + intensity * 0.3})`
    }

    draw()
  }

  private async handleAudio(stream: MediaStream): Promise<void> {
    stream.getTracks().forEach((t) => t.stop())
    const blob = new Blob(this.audioChunks, { type: 'audio/wav' })

    this.appendSystemMessage('user', '🎙 Voice message')
    this.setTyping(true)

    try {
      const audioBlob = await sendVoiceAudio(blob)
      const audioUrl = URL.createObjectURL(audioBlob)
      this.appendSystemMessage('assistant', '🔊 Voice response', audioUrl)
    } catch (err) {
      this.appendSystemMessage('assistant', `System error: ${err instanceof Error ? err.message : 'Voice request failed'}`)
    } finally {
      this.setTyping(false)
    }
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  // ── Arc reactor ───────────────────────────────────────────────────────────

  private initArc(): void {
    const canvas = this.el.querySelector<HTMLCanvasElement>('#arc-canvas')!
    this.arcCtx = canvas.getContext('2d')
    this.animArc()
  }

  private drawArc(pct: number): void {
    const ctx = this.arcCtx
    if (!ctx) return
    const cx = 45, cy = 45, r = 36, lw = 2.5
    ctx.clearRect(0, 0, 90, 90)
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(0,212,255,0.08)'; ctx.lineWidth = lw; ctx.stroke()
    const start = -Math.PI / 2
    ctx.beginPath(); ctx.arc(cx, cy, r, start, start + Math.PI * 2 * pct / 100)
    ctx.strokeStyle = '#00d4ff'; ctx.lineWidth = lw; ctx.stroke()
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 / 8) * i
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(a) * (r - 7), cy + Math.sin(a) * (r - 7))
      ctx.lineTo(cx + Math.cos(a) * (r + 7), cy + Math.sin(a) * (r + 7))
      ctx.strokeStyle = 'rgba(0,212,255,0.12)'; ctx.lineWidth = 1; ctx.stroke()
    }
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(0,212,255,0.35)'; ctx.lineWidth = 1; ctx.stroke()
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.14, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0,212,255,0.18)'; ctx.fill()
  }

  private animArc(): void {
    this.arcPct += this.arcDir * 0.04
    if (this.arcPct < 90) this.arcDir = 1
    if (this.arcPct > 97) this.arcDir = -1
    this.drawArc(this.arcPct)
    const pctEl = this.el.querySelector<HTMLElement>('#arc-pct')
    if (pctEl) pctEl.textContent = Math.round(this.arcPct) + '%'
    requestAnimationFrame(() => this.animArc())
  }

  // ── Timers ────────────────────────────────────────────────────────────────

  private startTimers(): void {
    setInterval(() => {
      const now = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      const clock = this.el.querySelector<HTMLElement>('#hud-clock')
      if (clock) clock.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} SGT`
    }, 1000)

    setInterval(() => {
      this.sessionSec++
      const m = String(Math.floor(this.sessionSec / 60)).padStart(2, '0')
      const s = String(this.sessionSec % 60).padStart(2, '0')
      const el = this.el.querySelector<HTMLElement>('#hud-session')
      if (el) el.textContent = `SESSION ${m}:${s}`
    }, 1000)

    setInterval(() => {
      this.tickerIdx = (this.tickerIdx + 1) % TICKERS.length
      const el = this.el.querySelector<HTMLElement>('#hud-ticker')
      if (el) el.textContent = TICKERS[this.tickerIdx]
    }, 3000)

    setInterval(() => {
      const apiPing = this.el.querySelector<HTMLElement>('#ping-llm')
      const webPing = this.el.querySelector<HTMLElement>('#ping-search')
      if (apiPing) apiPing.textContent = Math.round(8 + Math.random() * 30) + 'ms'
      if (webPing) webPing.textContent = Math.round(20 + Math.random() * 40) + 'ms'
    }, 3200)
  }

  private startVitalFlicker(): void {
    VITALS.forEach(v => {
      setInterval(() => {
        const val = Math.round(v.min + Math.random() * (v.max - v.min))
        const valEl = this.el.querySelector<HTMLElement>(`#${v.id}-val`)
        const fillEl = this.el.querySelector<HTMLElement>(`#${v.id}-fill`)
        if (valEl) valEl.textContent = String(val)
        if (fillEl) fillEl.style.width = val + '%'
      }, 2000 + Math.random() * 1500)
    })
  }
}
