const { ipcRenderer } = require('electron')
const path = require('path')

// canvas setup
const canvas = document.getElementById('kirby-canvas')
const ctx = canvas.getContext('2d')

canvas.width = window.screen.width
canvas.height = window.screen.height
canvas.style.width  = canvas.width  + 'px'
canvas.style.height = canvas.height + 'px'

const DISPLAY_FAT = 64
const DISPLAY_NORMAL = 96

//sprite sheet(now gone)
const DISPLAY = 96 // how big kirby renders on scrren, larger to compensate for fat kirby


//animation rows in sheet

const ANIM = {
    // ── Core locomotion ──────────────────────────────────────────
    walk:        { src: 'Kirby-walk_sheet.png',        frames: 10, frameW: 32, frameH: 25, fps: 12 },
    jump:        { src: 'Kirby-jump_sheet.png',         frames: 5,  frameW: 43, frameH: 40, fps: 10 },
    trip:        { src: 'Kirby-trip_sheet.png',         frames: 12, frameW: 30, frameH: 30, fps: 10 },
    idle:        { src: 'Kirby-idle_sheet.png',         frames: 7,  frameW: 27, frameH: 32, fps: 8  },
    realidle:    { src: 'Kirby-Realidle_sheet.png',     frames: 3,  frameW: 25, frameH: 31, fps: 6  },
    idleBlob:    { src: 'Kirby-IdleBlob_sheet.png',     frames: 6,  frameW: 43, frameH: 36, fps: 7  },
    idleFish:    { src: 'Kirby-IdleFish_sheet.png',     frames: 7,  frameW: 40, frameH: 54, fps: 8  },
    sleep:       { src: 'Kirby-Sleep_sheet.png',        frames: 3,  frameW: 36, frameH: 38, fps: 4  },
    wakeup:      { src: 'Kirby-Wakeup_sheet.png',       frames: 6,  frameW: 32, frameH: 31, fps: 8  },
    sneeze:      { src: 'Kirby-Sneeze_sheet.png',       frames: 7,  frameW: 23, frameH: 28, fps: 10 },
    hide:        { src: 'Kirby-Hide_sheet.png',         frames: 5,  frameW: 25, frameH: 33, fps: 8  },
    annoy:       { src: 'Kirby-annoy_sheet.png',        frames: 2,  frameW: 19, frameH: 32, fps: 6  },
    throwup:     { src: 'Kirby-Throwup_sheet.png',      frames: 5,  frameW: 33, frameH: 34, fps: 9  },
    eat:         { src: 'Kirby-eat_sheet.png',          frames: 6,  frameW: 53, frameH: 36, fps: 10 },
    fatWalk:     { src: 'Kirby-fatWalk_sheet.png',      frames: 10, frameW: 36, frameH: 44, fps: 10 },
    fatIdle:     { src: 'Kirby-Fatidle_sheet.png',      frames: 5,  frameW: 22, frameH: 40, fps: 7  },
    annoyReact1: { src: 'Kirby-AnnoyReact_1_sheet.png', frames: 2,  frameW: 17, frameH: 30, fps: 8  },
    annoyReact2: { src: 'Kirby-AnnoyReact_2_sheet.png', frames: 2,  frameW: 29, frameH: 26, fps: 8  },
    annoyReact3: { src: 'Kirby-AnnoyReact_3_sheet.png', frames: 2,  frameW: 61, frameH: 28, fps: 8  },
    annoyReact4: { src: 'Kirby-AnnoyReact_4_sheet.png', frames: 15, frameW: 17, frameH: 29, fps: 12 },
    annoyReact5: { src: 'Kirby-AnnoyReact_5_sheet.png', frames: 13, frameW: 23, frameH: 30, fps: 12 },
    annoyReact6: { src: 'Kirby-AnnoyReact_6_sheet.png', frames: 7,  frameW: 19, frameH: 28, fps: 10 },
    annoyReact7: { src: 'Kirby-AnnoyReact_7_sheet.png', frames: 10, frameW: 28, frameH: 37, fps: 12 },
    fishReact:   { src: 'Kirby-FishReact_sheet.png',    frames: 5,  frameW: 44, frameH: 47, fps: 9  },
}

const ANNOY_REACTS = [
    'annoyReact1','annoyReact2','annoyReact3','annoyReact4',
'annoyReact5','annoyReact6','annoyReact7'
]

const IDLE_ANIMS = ['idle', 'realidle', 'idleBlob', 'idleFish']

//loader for all sheets
const sheets = {}
Object.entries(ANIM).forEach(([key, anim]) => {
  const img = new Image()
  img.src = path.join(__dirname, `../assets/${anim.src}`)
  sheets[key] = img
})

// food image 
const foodImg = new Image()
foodImg.src = path.join(__dirname, '../assets/Foods/Kirby_Apple_Sprite.png')

// state 
let posX       = 200
let groundY    = window.screen.height - 140
let posY       = groundY

let dirX       = 1
let facingLeft = false

let animName   = 'walk'
let frameIdx   = 0
let frameTick  = 0

// Main state machine
// 'walk' | 'idle' | 'sleeping' | 'wakeup' | 'sneeze' | 'trip'
// 'eating' | 'walkToFood' | 'fatWalk' | 'fatIdle' | 'throwup'
// 'jumping' | 'annoyReact' | 'annoyChain'
let state      = 'walk'
let stateTimer = 0  // counts down to 0 then transitions

let isFat      = false
let pokeCount  = 0
let jumpY      = 0
let jumpV      = 0

// Idle timer — how long Kirby has been idle/walking without eating or sleeping
let idleTimer  = 0
const IDLE_TO_SLEEP = 1800   // 30 seconds at 60fps before sleep
const IDLE_TO_FOOD  = 900    // 15 seconds before food spawns

// Poke tracking — rapid pokes trigger annoy chain
let lastPokeTime  = 0
let pokeStreak    = 0
const POKE_WINDOW = 2000  // ms between pokes to count as a streak

// Animation complete flag — set by advanceFrame when last frame is reached
let animDone   = false

// ── Food item ─────────────────────────────────────────────────────
let food = null  // { x, y } or null

// ── Speech bubble ─────────────────────────────────────────────────
let bubble = null  // { text, timer }

const PHRASES = [
    'Poyo!', 'HIII~', '*SUCKS*', 'Poyo poyo!', 'I wanna snack ;(', 'Hai!', 'Oof', 
    'This place is pretty', 'wish I could hang out with you..', 'YAAWWWNNN'
]

function showBubble(text, duration = 3000) {
    bubble = { text, timer: duration}
}

function randomPhrase() {
    return PHRASES[Math.floor(Math.random() * PHRASES.length)]
}

function randomIdleAnim() {
    return IDLE_ANIMS[Math.floor(Math.random() * IDLE_ANIMS.length)]
}

function randomAnnoyReact(){
    return ANNOY_REACTS[Math.floor(Math.random() * ANNOY_REACTS.length)]
}

// display helper
function getDisplay() {
    return isFat ? DISPLAY_FAT : DISPLAY_NORMAL
}

// animation helpers
function setAnim(name){
    if (animName !== name){
        animName = name
        frameIdx = 0
        frameTick = 0
        animDone = false
    }
}

function advanceFrame(){
    const anim = ANIM[animName]
  if (!anim) return
  const ticksPerFrame = Math.max(1, Math.round(60 / anim.fps))
  frameTick++
  if (frameTick >= ticksPerFrame) {
    frameTick = 0
    if (frameIdx >= anim.frames - 1) {
      animDone = true
      frameIdx = 0  // loop back
    } else {
      frameIdx++
    }
  }
}



// state transitions
function enterWalk() {
    state = 'walk'
    setAnim(isFat ? 'fatWalk' : 'walk')
  }
  
  function enterIdle() {
    state = 'idle'
    stateTimer = 120 + Math.floor(Math.random() * 180) // 2-5 seconds
    setAnim(randomIdleAnim())
  }
  
  function enterSleep() {
    state = 'sleeping'
    idleTimer = 0
    setAnim('sleep')
    showBubble('zzz...')
  }
  
  function enterWakeup() {
    state = 'wakeup'
    setAnim('wakeup')
  }
  
  function enterSneeze() {
    state = 'sneeze'
    setAnim('sneeze')
  }
  
  function enterTrip() {
    state = 'trip'
    setAnim('trip')
  }

  function spawnFood() {
    //spawns food 150-180 px in front of the kirb
    const offset = (150 + Math.random() * 180) * dirX
    let fx = posX + offset
    fx = Math.max(60, Math.min(window.screen.width - 60, fx))
    food = { x: fx, y: groundY }  
    state = 'walkToFood'
    setAnim('walk')
  }

  function enterEat() {
    state = 'eating'
    food = null  // item disappears as he eats
    setAnim('eat')
    showBubble('Yummy!')
  }
  
  function enterFat() {
    isFat     = true
    pokeCount = 0
    idleTimer = 0
    enterWalk()
  }
  
  function enterThrowup() {
    state = 'throwup'
    setAnim('throwup')
  }
  
  function enterNormal() {
    isFat     = false
    pokeCount = 0
    posY      = groundY  // reset position in case fat was taller
    enterWalk()
  }
  
  function enterAnnoyReact() {
    state = 'annoyReact'
    setAnim(randomAnnoyReact())
  }
  
  function enterFatIdle() {
    state = 'fatIdle'
    stateTimer = 80 + Math.floor(Math.random() * 120)
    setAnim('fatIdle')
  }


// Main logi updates!!
function update() {
    const sw = window.screen.width
    const display = getDisplay()
    animDone = false // reset each frame, advance frame may set it true gotta see

    advanceFrame()

    if (jumpV !== 0 || jumpY < 0) {
        jumpY += jumpV
        jumpV += 1.8
        if (jumpY >= 0) { jumpY = 0; jumpV = 0 }
      }

      switch (state) {

        // ── WALK ──────────────────────────────────────────────────────
        case 'walk': {
          posX += dirX * (isFat ? 1.0 : 1.5)
    
          // Bounce off edges
          if (posX > sw - display) { posX = sw - display; dirX = -1; facingLeft = true  }
          if (posX < 0)             { posX = 0;            dirX =  1; facingLeft = false }
    
          idleTimer++
    
          // Fat Kirby — just walks and idles, no food/sleep
          if (isFat) {
            if (Math.random() < 0.003) enterFatIdle()
            break
          }
    
          // Normal Kirby random events while walking
          if (Math.random() < 0.003) { enterSneeze(); break }
          if (Math.random() < 0.002) { enterTrip();   break }
          if (Math.random() < 0.004) { enterIdle();   break }
    
          // Food spawns after idle timer
          if (idleTimer > IDLE_TO_FOOD && !food && Math.random() < 0.005) {
            spawnFood()
            break
          }
    
          // Sleep after even longer
          if (idleTimer > IDLE_TO_SLEEP && Math.random() < 0.003) {
            enterSleep()
            break
          }
    
          break
        }
    
        // ── WALK TO FOOD ───────────────────────────────────────────────
        case 'walkToFood': {
          if (!food) { enterWalk(); break }
    
          // Walk toward food
          const dist = food.x - posX
          if (dist > 0) { dirX = 1;  facingLeft = false }
          else          { dirX = -1; facingLeft = true  }
    
          posX += dirX * 1.5
    
          // Arrived at food
          if (Math.abs(dist) < 20) {
            enterEat()
          }
          break
        }
    
        // ── EATING ────────────────────────────────────────────────────
        case 'eating': {
          if (animDone) enterFat()
          break
        }
    
        // ── IDLE ──────────────────────────────────────────────────────
        case 'idle': {
          stateTimer--
          if (stateTimer <= 0) enterWalk()
          break
        }
    
        // ── FAT IDLE ─────────────────────────────────────────────────
        case 'fatIdle': {
          stateTimer--
          if (stateTimer <= 0) enterWalk()
          break
        }
    
        // ── SLEEPING ─────────────────────────────────────────────────
        case 'sleeping': {
          // Occasional zzz bubble
          if (Math.random() < 0.002) showBubble('zzz...')
          break
        }
    
        // ── WAKEUP ───────────────────────────────────────────────────
        case 'wakeup': {
          if (animDone) enterWalk()
          break
        }
    
        // ── SNEEZE ───────────────────────────────────────────────────
        case 'sneeze': {
          if (animDone) enterWalk()
          break
        }
    
        // ── TRIP ─────────────────────────────────────────────────────
        case 'trip': {
          if (animDone) enterWalk()
          break
        }
    
        // ── THROWUP ──────────────────────────────────────────────────
        case 'throwup': {
          if (animDone) {
            showBubble('BLEEGHHH')
            enterNormal()
          }
          break
        }
    
        // ── ANNOY REACT ───────────────────────────────────────────────
        case 'annoyReact': {
          if (animDone) enterWalk()
          break
        }
    
        // ── JUMPING ───────────────────────────────────────────────────
        case 'jumping': {
          if (jumpY === 0 && jumpV === 0) {
            // landed
            enterWalk()
          }
          break
        }
      }
}
// DRAWING IT ALL
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  
    const display = getDisplay()
    // Draw food item if present
    if (food) {
      drawFood(food.x, food.y)
    }
  
    // Draw Kirby
    const anim  = ANIM[animName]
    const sheet = sheets[animName]
    if (!sheet || !sheet.complete || !anim) return
  
    const sx    = frameIdx * anim.frameW
    const sy    = 0
    const drawX = posX
    const drawY = posY + jumpY
  
    ctx.save()
    if (facingLeft) {
      ctx.translate(drawX + display / 2, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(sheet, sx, sy, anim.frameW, anim.frameH,
                    -display / 2, drawY, display, display)
    } else {
      ctx.drawImage(sheet, sx, sy, anim.frameW, anim.frameH,
                    drawX, drawY, display, display)
    }
    ctx.restore()
  

    // Speech bubble
    if (bubble) drawBubble()
  }

  // food
  function drawFood(x, y) {
    if (!foodImg.complete) return
    const size = 32  // adjust this to whatever looks good on screen
    ctx.drawImage(foodImg, x, y, size, size)
  }

  // speech bubble
  function drawBubble() {
    const display = getDisplay()
    const bx = posX + display / 2
    const by = posY + jumpY - 10
  
    ctx.font = 'bold 13px "Comic Sans MS", monospace'
    ctx.textAlign = 'center'
    const tw  = ctx.measureText(bubble.text).width
    const pad = 10
    const bw  = tw + pad * 2
    const bh  = 28
  
    // Box
    ctx.fillStyle   = '#ffffff'
    ctx.strokeStyle = '#f0a0d0'
    ctx.lineWidth   = 2
    roundRect(ctx, bx - bw / 2, by - bh - 10, bw, bh, 8)
    ctx.fill()
    ctx.stroke()
  
    // Tail
    ctx.beginPath()
    ctx.moveTo(bx - 6, by - 10)
    ctx.lineTo(bx + 6, by - 10)
    ctx.lineTo(bx,     by + 2)
    ctx.closePath()
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = '#f0a0d0'
    ctx.stroke()
  
    // Text
    ctx.fillStyle = '#884466'
    ctx.fillText(bubble.text, bx, by - bh / 2 - 10 + 5)
  }
  
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }
  
  // ── Mouse interaction ─────────────────────────────────────────────
function isOverKirby(mx, my) {
  const display = getDisplay()
  const kx = posX
  const ky = posY + jumpY
  return mx >= kx && mx <= kx + display &&
         my >= ky && my <= ky + display
}

window.addEventListener('mousemove', (e) => {
  if (isOverKirby(e.clientX, e.clientY)) {
    ipcRenderer.send('set-ignore-mouse', false)
    canvas.style.cursor = 'pointer'
  } else {
    ipcRenderer.send('set-ignore-mouse', true)
    canvas.style.cursor = 'none'
  }
})

window.addEventListener('click', (e) => {
  if (!isOverKirby(e.clientX, e.clientY)) return

  const now = Date.now()

  // ── Sleeping → wake up ────────────────────────────────────────
  if (state === 'sleeping') {
    enterWakeup()
    return
  }

  // ── Fat Kirby poke ────────────────────────────────────────────
  if (isFat) {
    pokeCount++
    if (pokeCount >= 3) {
      enterThrowup()
    } else {
      // Small hop so poke feels responsive
      if (jumpY === 0) jumpV = -8
    }
    return
  }

  // ── Normal Kirby poke ─────────────────────────────────────────
  // Check for rapid poke streak → annoy react
  if (now - lastPokeTime < POKE_WINDOW) {
    pokeStreak++
  } else {
    pokeStreak = 1
  }
  lastPokeTime = now

  if (pokeStreak >= 3) {
    pokeStreak = 0
    enterAnnoyReact()
    return
  }

  // Single poke — jump and say something
  if (jumpY === 0) jumpV = -14
  state = 'jumping'
  setAnim('jump')
  showBubble(randomPhrase())
})

// Bubble tick 
function tickBubble() {
  if (bubble) {
    bubble.timer -= 16
    if (bubble.timer <= 0) bubble = null
  }
}

// Za main loop
function loop() {
  requestAnimationFrame(loop)
  update()
  tickBubble()
  draw()
}

// Start when all sheets ready 
let loaded = 0
const allImages = [...Object.values(sheets), foodImg]  // add foodImg here
const total = allImages.length
allImages.forEach(img => {
  img.onload  = () => { loaded++; if (loaded === total) loop() }
  img.onerror = () => { loaded++; if (loaded === total) loop() }
})