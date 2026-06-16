const BOOT_LINES = [
  { text: 'Initialising neural interface...', type: '' },
  { text: 'Loading Llama 3.2 model... [OK]', type: 'ok' },
  { text: 'Connecting to local backend... [OK]', type: 'ok' },
  { text: 'Mounting vector memory... [OK]', type: 'ok' },
  { text: 'Shell exec module loaded... [OK]', type: 'ok' },
  { text: 'Web search tool ready... [OK]', type: 'ok' },
  { text: 'Voice I/O... [STANDBY]', type: 'warn' },
  { text: 'Loading user profile: PARTH / SGP-NODE-01', type: '' },
  { text: 'All systems operational.', type: 'ok' },
]

export function BootScreen(onLaunch: () => void): HTMLElement {
  const el = document.createElement('div')
  el.id = 'boot'
  el.innerHTML = `
    <div class="boot-rings">
      <div class="ring ring1"></div>
      <div class="ring ring2"></div>
      <div class="ring ring3"></div>
      <div class="arc-core"></div>
    </div>
    <div class="boot-logo">J.A.R.V.I.S</div>
    <div class="boot-tagline">Just A Rather Very Intelligent System</div>
    <div class="boot-log" id="boot-log"></div>
    <button class="boot-btn" id="boot-btn" style="opacity:0;pointer-events:none">
      INITIALISE HUD
    </button>
  `

  const log = el.querySelector<HTMLDivElement>('#boot-log')!
  const btn = el.querySelector<HTMLButtonElement>('#boot-btn')!

  btn.addEventListener('click', () => {
    el.classList.add('fade-out')
    setTimeout(onLaunch, 700)
  })

  let i = 0
  function nextLine() {
    if (i >= BOOT_LINES.length) {
      btn.style.opacity = '1'
      btn.style.pointerEvents = 'all'
      return
    }
    const line = document.createElement('div')
    line.className = `boot-line ${BOOT_LINES[i].type}`
    line.textContent = '> ' + BOOT_LINES[i].text
    log.appendChild(line)
    i++
    setTimeout(nextLine, 300 + Math.random() * 180)
  }
  setTimeout(nextLine, 1400)

  return el
}
