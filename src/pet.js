const { ipcRenderer } = require('electron')
const path = require('path')

// canvas setup
const canvas = document.getElementById('kirby-canvas')
const ctx = canvas.getContext('2d')

canvas.width = window.screen.width
canvas.height = window.screen.height
canvas.style.width  = canvas.width  + 'px'
canvas.style.height = canvas.height + 'px'

const DISPLAY_FAT = 96
const DISPLAY_NORMAL = 64



//animation rows in sheet

const SPRITES = path.join(__dirname, '../assets/Kirby-Sprites')

const ANIM = {
  walk:        { frames: 10, fps: 8  }, //adjusted fps was 8 now 6
  jump:        { frames: 6,  fps: 10 },
  trip:        { frames: 12, fps: 5  }, //adjusted fps was 7 now 5
  idle:        { frames: 3,  fps: 3  }, //adjusted fps was 5 now 3
  cuteIdle:    { frames: 7,  fps: 3, loopFrames: [2, 3, 4], loopCount: 3  }, //adjusted fps was 5 now 3
  sleep:       { frames: 3,  fps: 2  }, //adjusted fps was 4 now 2
  wakeup:      { frames: 6,  fps: 8  },
  sneeze:      { frames: 5,  fps: 4  }, //adjusted fps was 7 now 4
  hide:        { frames: 4,  fps: 8  },
  annoy:       { frames: 1,  fps: 1  }, //adjusted fps was 6 now 1
  throwup:     { frames: 5,  fps: 9  },
  eat:         { frames: 9,  fps: 10 },
  fatWalk:     { frames: 10, fps: 10 },
  fatIdle:     { frames: 3,  fps: 7  },
  idleBlob:    { frames: 8,  fps: 5, loopFrames: [6, 7], loop: 4  },
  idleFish:    { frames: 6,  fps: 3, loopFrames: [0, 1, 2], loopCount: 3   }, //adjusted fps was 6 now 2
  fishReact:   { frames: 5,  fps: 9  },
  annoyReact1: { frames: 1,  fps: 1  }, //adjusted fps was 6 now 1
  annoyReact2: { frames: 2,  fps: 6,loopFrames: [0, 1 ], loopCount: 3  },
  annoyReact3: { frames: 4,  fps: 6  },
  annoyReact4: { frames: 9,  fps: 7  },
  annoyReact5: { frames: 10, fps: 7  },
  annoyReact6: { frames: 4,  fps: 4, loopFrames: [3], loopCount: 2   }, //adjusted fps was 7 now 5
  annoyReact7: { frames: 9,  fps: 7  },
}

const ANNOY_REACTS = [
  'annoyReact1', 'annoyReact2', 'annoyReact3',
  'annoyReact4', 'annoyReact5', 'annoyReact6', 'annoyReact7'
]

const IDLE_ANIMS = ['idle', 'cuteIdle', 'idleBlob', 'idleFish']

//loader for all sprites
const sheets = {}

function loadFrames(key, folder, namePattern, count) {
  sheets[key] = []
  for (let i = 1; i <= count; i++) {
    const img = new Image()
    img.src = path.join(SPRITES, folder, namePattern.replace('#', i))
    sheets[key].push(img)
  }
}

// core
loadFrames('walk',     'Kirby walk',     'Kirby-walk-#.png',      11)
loadFrames('jump',     'Kirby Jump',     'Kirby_jump_#.png',       6)
loadFrames('trip',     'Kirby Trip',     'Kirby_trip_#.png',      12)
loadFrames('idle',     'Idle',           'Kirby_Idle_#.png',       3)
loadFrames('cuteIdle', 'Cute Idle',      'cute_idle_#.png',        7)
loadFrames('sleep',    'Kirby sleep',    'Kirby_Sleep_#.png',      3)
loadFrames('wakeup',   'wakeup',         'Kirby_Wakeup_#.png',     6)
loadFrames('sneeze',   'Sneeze',         'Kirby_Sneeze_#.png',     5)
loadFrames('hide',     'Hide',           'Kirby_Hide_#.png',       4)
loadFrames('throwup',  'Throwup',        'Kirby_Throwup_#.png',    5)
loadFrames('eat',      'Kirby eat',      'Kirby_eat_#.png',        9)

// fat kirby
loadFrames('fatWalk',  'Fat walk',       'Kirby_fatWalk_#.png',   10)
loadFrames('fatIdle',  'Fat Idle',       'Kirby_Fatidle_#.png',    3)

// idles
loadFrames('idleBlob', 'Blob',           'Kirby_IdleBlob_#.png',   8)
loadFrames('idleFish', 'Fishing',        'Kirby_IdleFish_#.png',   6)

// fish react
loadFrames('fishReact','Fish Reaction',  'Kirby-FishReact_#_sheet.png', 5)

// annoy (single sheet file, not split — handle separately)
sheets['annoy'] = []
const annoyImg = new Image()
annoyImg.src = path.join(SPRITES, 'Kirby Annoy', 'Kirby-annoy sheet.png')
sheets['annoy'].push(annoyImg)

// annoy react 1 (single file in root of Annoy Reactions)
sheets['annoyReact1'] = []
const ar1 = new Image()
ar1.src = path.join(SPRITES, 'Annoy Reactions', 'Kirby-AnnoyReact_1 sheet.png')
sheets['annoyReact1'].push(ar1)

// annoy reacts 2-7 (each in their own subfolder)
loadFrames('annoyReact2', 'Annoy Reactions/React 2', 'Kirby-AnnoyReact2_#_sheet.png',  2)
loadFrames('annoyReact3', 'Annoy Reactions/React 3', 'Kirby-AnnoyReact3_#_sheet.png',  4)
loadFrames('annoyReact4', 'Annoy Reactions/React 4', 'Kirby-AnnoyReact4_#_sheet.png',  9)
loadFrames('annoyReact5', 'Annoy Reactions/React 5', 'Kirby-AnnoyReact5_#_sheet.png', 10)
loadFrames('annoyReact6', 'Annoy Reactions/React 6', 'Kirby-AnnoyReact6_#_sheet.png',  4)
loadFrames('annoyReact7', 'Annoy Reactions/React 7', 'Kirby-AnnoyReact7_#_sheet.png',  9)
// food image 
const foodImg = new Image()
foodImg.src = path.join(__dirname, '../assets/Foods/Kirby_Apple_Sprite.png')


/// Error image loding finder
Object.entries(sheets).forEach(([key, frames]) => {
  frames.forEach((img, i) => {
    img.onerror = () => console.error(`FAILED: ${key} frame ${i+1} → ${img.src}`)
    img.onload  = () => console.log(`ok: ${key} frame ${i+1}`)
  })
})
foodImg.onerror = () => console.error(`FAILED: foodImg → ${foodImg.src}`)
foodImg.onload  = () => console.log(`ok: foodImg`)


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

function advanceFrame() {
  const anim = ANIM[animName]
  if (!anim) return

  const ticksPerFrame = Math.max(1, Math.round(60 / anim.fps))
  frameTick++
  if (frameTick < ticksPerFrame) return
  frameTick = 0

  // ── loop frames ───────────────────────────────────────────────
  // if we're in the loop range, cycle through it loopCount times
  if (anim.loopFrames && !animDone) {
    const [loopStart, loopEnd] = [anim.loopFrames[0], anim.loopFrames[anim.loopFrames.length - 1]]

    // initialise loop counter
    if (typeof anim._loopsDone === 'undefined') anim._loopsDone = 0

    if (frameIdx >= loopStart && frameIdx <= loopEnd) {
      if (frameIdx === loopEnd) {
        anim._loopsDone++
        if (anim._loopsDone >= anim.loopCount) {
          // finished looping — continue to end of animation
          anim._loopsDone = undefined
          frameIdx++
          if (frameIdx >= anim.frames) {
            animDone = true
            frameIdx = 0
          }
        } else {
          // loop back to start of loop range
          frameIdx = loopStart
        }
      } else {
        frameIdx++
      }
      return
    }
  }

  // ── hold last frame ───────────────────────────────────────────
  if (frameIdx === anim.frames - 1 && anim.holdLastFrame) {
    frameTick++
    if (frameTick >= anim.holdLastFrame) {
      frameTick = 0
      animDone = true
      frameIdx = 0
    }
    return
  }

  // ── normal advance ────────────────────────────────────────────
  if (frameIdx >= anim.frames - 1) {
    animDone = true
    frameIdx = 0
  } else {
    frameIdx++
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
    showBubble('SUUUUCCCKKCKC')
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
            if (!isDragging) {
              // apply gravity when dropped
              if (jumpY < 0 || jumpV !== 0) {
                jumpY += jumpV
                jumpV += 1.8
                if (jumpY >= 0) { jumpY = 0; jumpV = 0 }
              }
              // only transition to walk once grounded and not being dragged
              if (posY >= groundY && jumpV === 0) {
                posY = groundY
                enterWalk()
              }
            }
            break
          }
        }
    }
// DRAWING IT ALL
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const display = getDisplay()

  if (food) drawFood(food.x, food.y)

  // get current frame image from array
  const frameImg = sheets[animName]?.[frameIdx]
  if (!frameImg || !frameImg.complete || frameImg.naturalWidth === 0) return

  const drawX = posX
  const drawY = posY + jumpY

  ctx.save()
  if (facingLeft) {
    ctx.translate(drawX + display / 2, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(frameImg, -display / 2, drawY, display, display)
  } else {
    ctx.drawImage(frameImg, drawX, drawY, display, display)
  }
  ctx.restore()

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
  
    ctx.font = 'bold 13px "Comic Sans MS", monospace' /// Look into getting cute kirby font
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
  
  // mouse interaction
let dragging   = false
let dragOffX   = 0
let dragOffY   = 0
let isDragging = false

function isOverKirby(mx, my) {
  const display = getDisplay()
  const kx = posX
  const ky = posY + jumpY
  return mx >= kx && mx <= kx + display &&
         my >= ky && my <= ky + display
}

window.addEventListener('mousemove', (e) => {
  if (isDragging) {
    // move Kirby with the mouse
    posX = e.clientX - dragOffX
    posY = e.clientY - dragOffY
    jumpY = 0
    jumpV = 0

    // clamp to screen
    const display = getDisplay()
    posX = Math.max(0, Math.min(window.screen.width  - display, posX))
    posY = Math.max(0, Math.min(window.screen.height - display, posY))
    return
  }

  if (isOverKirby(e.clientX, e.clientY)) {
    ipcRenderer.send('set-ignore-mouse', false)
    canvas.style.cursor = 'grab'
  } else {
    ipcRenderer.send('set-ignore-mouse', true)
    canvas.style.cursor = 'none'
  }
})

window.addEventListener('mousedown', (e) => {
  if (!isOverKirby(e.clientX, e.clientY)) return
  
  const display = getDisplay()
  isDragging = true
  dragOffX   = e.clientX - posX
  dragOffY   = e.clientY - posY

  // play jump anim while held
  state = 'jumping'
  setAnim('jump')
  frameIdx = 0

  ipcRenderer.send('set-ignore-mouse', false)
  canvas.style.cursor = 'grabbing'
})

window.addEventListener('mouseup', (e) => {
  if (!isDragging) return
  isDragging = false
  canvas.style.cursor = 'none'
  ipcRenderer.send('set-ignore-mouse', true)

  // drop him — if above ground let him fall, otherwise just walk
  if (posY < groundY) {
    jumpV = 2   // small downward velocity so he falls naturally
    state = 'jumping'
  } else {
    posY  = groundY
    enterWalk()
  }
})

window.addEventListener('click', (e) => {
  if (!isOverKirby(e.clientX, e.clientY)) return
  if (isDragging) return  // ignore clicks that are part of a drag

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
      if (jumpY === 0) jumpV = -8
    }
    return
  }

  // ── Normal Kirby poke → annoy ─────────────────────────────────
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

  // single click → annoy animation + phrase
  state = 'annoyReact'
  setAnim('annoy')
  showBubble(randomPhrase())
})


// bubble tick
function tickBubble(){
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
const allFrameImages = Object.values(sheets).flat()
const allImages = [...allFrameImages, foodImg]
const total = allImages.length
let loaded = 0

allImages.forEach(img => {
  img.onload  = () => { loaded++; if (loaded === total) loop() }
  img.onerror = () => {
    console.error(`failed: ${img.src}`)
    loaded++
    if (loaded === total) loop()
  }
})