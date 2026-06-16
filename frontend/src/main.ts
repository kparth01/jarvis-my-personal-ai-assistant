import { BootScreen } from './components/BootScreen'
import { HUDScreen } from './components/HUDScreen'
import './style.css'

const app = document.getElementById('app')!

// background canvas
const canvas = document.createElement('canvas')
canvas.id = 'grid-canvas'
document.body.appendChild(canvas)
initParticleBackground(canvas)

// boot screen
const hud = new HUDScreen()
app.appendChild(hud.getElement())

const boot = BootScreen(() => {
  boot.remove()
  hud.show()
})
app.appendChild(boot)

// ── Particle background ───────────────────────────────────────────────────

function initParticleBackground(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d')!
  let W = 0, H = 0

  interface Particle {
    x: number; y: number
    vx: number; vy: number
    r: number; a: number
  }

  let particles: Particle[] = []

  function resize() {
    W = canvas.width = window.innerWidth
    H = canvas.height = window.innerHeight
    particles = Array.from({ length: 70 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.2 + 0.3, a: Math.random() * 0.35 + 0.1
    }))
  }

  resize()
  window.addEventListener('resize', resize)

  function draw() {
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, W, H)

    ctx.strokeStyle = 'rgba(0,212,255,0.03)'
    ctx.lineWidth = 0.5
    for (let x = 0; x < W; x += 44) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
    }
    for (let y = 0; y < H; y += 44) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
    }

    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(0,212,255,${p.a})`; ctx.fill()
    })

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x
        const dy = particles[i].y - particles[j].y
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d < 90) {
          ctx.beginPath()
          ctx.moveTo(particles[i].x, particles[i].y)
          ctx.lineTo(particles[j].x, particles[j].y)
          ctx.strokeStyle = `rgba(0,212,255,${0.07 * (1 - d / 90)})`
          ctx.lineWidth = 0.4; ctx.stroke()
        }
      }
    }
    requestAnimationFrame(draw)
  }
  draw()
}
