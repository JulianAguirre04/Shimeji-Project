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

const sounds = {
  poke: new Audio(path.join(__dirname, '../assets/sounds/poke.wav')),
  eat: new Audio(path.join(__dirname, '../assets/sounds/suck.mp3')),
  jump: new Audio(path.join(__dirname, '../assets/sounds/jump.wav')),
  poyo: new Audio(path.join(__dirname, '../assets/sounds/poyo.mp3')),
  dance: new Audio(path.join(__dirname, '../assets/sounds/dance.mp3')),
  hai: new Audio(path.join(__dirname, '../assets/sounds/hai.mp3')),
  fountainofdreams: new Audio(path.join(__dirname, '../assets/sounds/fountain-of-dreams.mp3')),
  victory: new Audio(path.join(__dirname, '../assets/sounds/Kirbys_Victory.mp3'))

}


// Volume for all sounds
Object.values(sounds).forEach(s => s.volume = 0.5) 

function playSound(name, rate = 1.0) {
  const s = sounds[name]
  if (!s) return
  s.currentTime = 0  // rewind so it can replay quickly
  s.playbackRate = rate //// 1.0 = normal, 0.5 = half speed, 1.5 = normal and a half speed
  s.play()
}

function playSoundLoop(name, rate = 1.0) {
  const s = sounds[name]
  if (!s) return
  s.currentTime = 0
  s.loop = true   // loop until stopped
  s.playbackRate = rate //// 1.0 = normal, 0.5 = half speed, 1.5 = normal and a half speed
  s.play()
}

function stopSound(name) {
  const s = sounds[name]
  if (!s) return
  s.loop = false
  s.pause()
  s.currentTime = 0
}
//animation rows in sheet

const soundTriggers =[
  'poke', 'eat', 'jump', 'poyo', 'dance', 'hai'
]

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
  hide:        { frames: 4,  fps: 6  },
  annoy:       { frames: 1,  fps: 1  }, //adjusted fps was 6 now 1
  throwup:     { frames: 5,  fps: 9  },
  eat:         { frames: 9,  fps: 10 },
  fatWalk:     { frames: 10, fps: 10 },
  fatIdle:     { frames: 3,  fps: 7  },
  idleBlob:    { frames: 8,  fps: 5, loopFrames: [6, 7], loop: 4  },
  idleFish:    { frames: 6,  fps: 3, loopFrames: [0, 1, 2], loopCount: 3   }, //adjusted fps was 6 now 2
  fishReact:   { frames: 5,  fps: 4  }, //adjusted fps was 9 now 4
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


// skin loader---------------------
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

const fs = require('fs')
const foodFolder = path.join(__dirname, '../assets/Foods')
const foodFiles  = fs.readdirSync(foodFolder).filter(f => f.endsWith('.png'))
const foodImages = foodFiles.map(f => {
  const img = new Image()
  img.src = path.join(foodFolder, f)
  return img
})

function randomFoodImg() {
  return foodImages[Math.floor(Math.random() * foodImages.length)]
}

//skins------------------------------------------------------------------------------
const SKINS = {
  normal: {
    label: 'Normal Kirby',
    folder: null,  // uses default SPRITES path
    anims: null,   // uses default ANIM
  },
  beam: {
    label: 'Beam Kirby',
    folder: path.join(__dirname, '../assets/Kirby-Sprites/Beam-Kirby'),
    anims: {
      walk:          { frames: 12, fps: 8,  folder: 'Walk',                    pattern: 'BKirby_walk_#.png'          },
      jump:          { frames: 6,  fps: 10, folder: 'jump',                    pattern: 'BKirby_jump_#.png'          },
      idle:          { frames: 3,  fps: 4,  folder: 'idle',                    pattern: 'BKirby_idle_#.png'          },
      cuteIdle:      { frames: 2,  fps: 3,  folder: 'cuteIdle',                pattern: 'BKirby_cuteIdle_#.png'      },
      idleBlob:      { frames: 3,  fps: 3,  loopFrames: [1, 2], loop: 4,  folder: 'blob',                    pattern: 'BKirby_blob_#.png'          },
      eat:           { frames: 5,  fps: 10, folder: 'Eat',                     pattern: 'BKirby_eat_#.png'           },
      throwup:       { frames: 5,  fps: 9,  folder: 'Spit',                    pattern: 'BKirby_spit_#.png'          },
      trip:          { frames: 16, fps: 5,   loopFrames: [15], loop: 3,  folder: 'Trip',                    pattern: 'BKirby_trip_#.png'          },
      trip2:         { frames: 5,  fps: 4,   loopFrames: [4], loop: 3,  folder: 'Trip2',                   pattern: 'BKirby_trip2_#.png'         },
      annoy:         { frames: 1,  fps: 1,  folder: 'Annoy_react',             pattern: 'BKirby_annoy_0.png'         },
      bAnnoyReact1:  { frames: 3,  fps: 4,  folder: 'Annoy_reactions/Reaction_1', pattern: 'BKirby_annoy_react_#.png'  },
      bAnnoyReact2:  { frames: 6,  fps: 3,  folder: 'Annoy_reactions/Reaction_2', pattern: 'BKirby_annoy_react2_#.png' },
      bAnnoyReact3:  { frames: 9,  fps: 4,  folder: 'Annoy_reactions/Reaction_3', pattern: 'BKirby_annoy_react3_#.png' },
      fatWalk: { frames: 10, fps: 10, folder: 'fatwalk', pattern: 'Bkirby_fatwalk_#.png' },
      fatIdle: { frames: 3,  fps: 7,  folder: 'fatidle', pattern: 'Bkirby_fatidle_#.png' },
    }
  }
}

const BEAM_ANNOY_REACTS = ['bAnnoyReact1', 'bAnnoyReact2', 'bAnnoyReact3']

let currentSkin = 'normal'
const skinSheets = {}  // stores loaded frames per skin
//skins----------------------------------------------------------------------------------

//skin loader --------------------------
function loadSkinFrames(skinKey) {
  const skin = SKINS[skinKey]
  if (!skin || !skin.anims) return

  skinSheets[skinKey] = {}

  Object.entries(skin.anims).forEach(([animKey, animDef]) => {
    skinSheets[skinKey][animKey] = []
    // handle single-file anims (frames: 1) that use _0 naming
    if (animKey === 'annoy') {
      const img = new Image()
      img.src = path.join(skin.folder, animDef.folder, animDef.pattern)
      img.onerror = () => console.error(`FAILED: ${skinKey}/${animKey} → ${img.src}`)
      img.onload  = () => console.log(`ok: ${skinKey}/${animKey}`)
      skinSheets[skinKey][animKey].push(img)
      return
    }
    for (let i = 1; i <= animDef.frames; i++) {
      const img = new Image()
      img.src = path.join(skin.folder, animDef.folder, animDef.pattern.replace('#', i))
      img.onerror = () => console.error(`FAILED: ${skinKey}/${animKey} frame ${i} → ${img.src}`)
      img.onload  = () => console.log(`ok: ${skinKey}/${animKey} frame ${i}`)
      skinSheets[skinKey][animKey].push(img)
    }
  })
}

// load all skins upfront
Object.keys(SKINS).forEach(key => {
  if (key !== 'normal') loadSkinFrames(key)
})

// IPC listener for skin switching
ipcRenderer.on('set-skin', (e, skinKey) => {
  if (!SKINS[skinKey]) return
  currentSkin = skinKey
  console.log(`Skin changed to: ${skinKey}`)
  // reset animation so it picks up new skin frames immediately
  setAnim('walk')
  enterWalk()
})



/// Error image loding finder
Object.entries(sheets).forEach(([key, frames]) => {
  frames.forEach((img, i) => {
    img.onerror = () => console.error(`FAILED: ${key} frame ${i+1} → ${img.src}`)
    img.onload  = () => console.log(`ok: ${key} frame ${i+1}`)
  })
})


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
// 'jumping' | 'annoyReact' | 'annoyChain' | 'hide' |
let lastIdleAnim = null
let state      = 'walk'
let stateTimer = 0  // counts down to 0 then transitions

let isFat      = false
let pokeCount  = 0
let jumpY      = 0
let jumpV      = 0

// Hidden varibles - lets kirby "hide" and "reappear"
let isHidden    = false
let hideTimer   = 0
let isReversing = false

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
    'This place is pretty', 'wish I could hang out with you for real..', 'YAAWWWNNN', 'remeber to drink water!',
    'Borgor..', 'mmmmmmm double cheesborgor......', 'I should invite metaknight','Can we play pls!!', 'Im gonna eat you >:)',
    ':o', 'WOW, you seem really smart :o', 'WOOOW!', 'Aleexiisssssss..', 'Can I watch you play!', 'i could go for a nap rn',
    '*wiggles*',  '*stares at you*', 'ill fight anyone for you!!', 'i believe in you!!', 'have you eaten today?',
    'WAHHH >:)', 'got any snacks?', 'can we go somewhere together'
]

// helps select the right skin or frames for whatever situation
function getFrames(animKey) {
  // lets skins override for specific animations
  const skin = SKINS[currentSkin]
  if (currentSkin !== 'normal' && skin.anims && skin.anims[animKey]){
    return skinSheets[currentSkin][animKey]
  }
  console.log(`falling back to normal for: ${animKey}`) // remove this later
  return sheets[animKey]
}

function getAnimDef(animKey){
  // get fps/frames from skin if available, otherwise revert back to default kirby
  const skin = SKINS[currentSkin]
  if (currentSkin !== 'normal' && skin.anims && skin.anims[animKey]) {
    return skin.anims[animKey]
  }
  return ANIM[animKey]
}

function getTimeInfo() {
  const now   = new Date()
  const hour  = now.getHours()
  const month = now.getMonth() + 1  // 1-12
  const day   = now.getDate()

  return {
    hour,
    month,
    day,
    isNight:     hour >= 22 || hour < 2,   // 10pm - 2am
    isLateNight: hour >= 2  && hour < 6,   // 2am - 6am
    isMorning:   hour >= 6  && hour < 12,
    isDay:       hour >= 12 && hour < 18,
    isEvening:   hour >= 18 && hour < 22,

    // special dates
    isNewYears:    month === 1  && day === 1,
    isAlexisBirthday: month === 1  && day === 17,
    isMyBirthday:month === 3  && day === 10,
  }
}

const PHRASES_NIGHT = [
  'so sleepy...', '*yawns softly*', 'the stars are pretty tonight',
  'dont stay up too late...', 'its so quiet out here',
  'goodnight...', 'why are we still awake',
  'the moon looks nice', 'Kirby is very sleepy poyo',
  '*blinks slowly*', 'are you still working??', 'I want a night snack',
  'movie night???', 'I wanna see the stars!!', 'a bed sounds so nice rn',
  'do you like me or snoopy more??', 'need a midnight snack'
]

const PHRASES_LATE_NIGHT = [
  'its so late...', '*yawns*', 'uuhhhhhhhhh',
  'I can barely keep my eyes open', 'zzzpoyo...',
  'the world is so quiet now', '*droopy eyes*',
  'are you winning?', 'dont you need your beauty sleep or smth...',
  'are you still working??', 'when can we go to bed :(', 'need a midnight snack'
]

const PHRASES_NEW_YEARS = [
  'happy new year!', 'new year new kirby!!',
  '*blows party horn*', 'another year of adventures!',
  'Hope your year has been amazing!', 'cant wait to spend another year with you!'
]

const PHRASES_Alexis_BIRTHDAY = [
  'Happy birthday!', 'Today is super special!',
  'make a wish~', 'hope your day is amazing!',
  'poyo! its your birthday!!!!'
]

const PHRASES_My_BIRTHDAY = [
  'Today seems weird..', '<3 <3 <3',
]

function getPhrasesForNow() {
  const t = getTimeInfo()
  if (t.isAlexisBirthday)  return PHRASES_Alexis_BIRTHDAY
  if (t.isMyBirthday)   return PHRASES_My_BIRTHDAY
  if (t.isNewYears)     return PHRASES_NEW_YEARS
  if (t.isLateNight)    return PHRASES_LATE_NIGHT
  if (t.isNight)        return PHRASES_NIGHT
  return PHRASES
}

function randomPhrase() {
  const pool = getPhrasesForNow()
  return pool[Math.floor(Math.random() * pool.length)]
}

function showBubble(text, duration = 3000) {
    bubble = { text, timer: duration}
}

function randomIdleAnim() {
    return IDLE_ANIMS[Math.floor(Math.random() * IDLE_ANIMS.length)]
}

function randomAnnoyReact() {
  if (currentSkin === 'beam') {
    // 50/50 split between beam-specific and normal annoy reacts
    const pool = Math.random() < 0.5 ? BEAM_ANNOY_REACTS : ANNOY_REACTS
    return pool[Math.floor(Math.random() * pool.length)]
  }
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
  const anim = getAnimDef(animName) 
  if (!anim) return
//-------Reverse frames------------------------------------------------
if (isReversing) {
  const ticksPerFrame = Math.max(1, Math.round(60 / anim.fps))
  frameTick++
  if (frameTick >= ticksPerFrame) {
    frameTick = 0
    if (frameIdx <= 0) {
      animDone = true
      frameIdx = 0
      isReversing = false
    } else {
      frameIdx--
    }
  }
  return
}
//----------------------------------------------------------
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


// state transitions aka The State Machine
function enterWalk() {
    state = 'walk'
    setAnim(isFat ? 'fatWalk' : 'walk')
  }
  
  function enterIdle() {
    state = 'idle'
    stateTimer = 240 + Math.floor(Math.random() * 240) //4-8 seconds of idle
    const chosen = randomIdleAnim()
    lastIdleAnim = chosen
    setAnim(chosen)
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
    showBubble('ACHOOOO')
  }
  
  function enterTrip() {
    state = 'trip'
    setAnim('trip')
    showBubble('*trips*')
  }

  function enterTrip2(){
    state = 'trip2'
    setAnim('trip2')
    showBubble('WWAhhha!')
  }

  let currentFoodImg = null

  function spawnFood() {
    //spawns food 150-180 px in front of the kirb
    const offset = (150 + Math.random() * 180) * dirX
    let fx = posX + offset
    fx = Math.max(60, Math.min(window.screen.width - 60, fx))
    food = { x: fx, y: groundY } 
    currentFoodImg = randomFoodImg() // random food duh
    state = 'walkToFood'
    setAnim('walk')
  }

  function enterEat() {
    state = 'eating'
    food = null  // item disappears as he eats
    playSound('eat', 1.5)
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
    showBubble('Poyo <3')
    playSound('poke')
    if (Math.random() < 0.2) playSound('hai') // 20% chance of "HAI!!!""
    else if (Math.random() < 0.15) playSound('dance') // 12% chance of dance
    else if (Math.random() < 0.05) playSound('Victory') // 4% chance of victory!!!! 0.05
      else if (Math.random() < 0.02) playSound ('fountainofdreams') // 1.3% chance of greatness 0.02
  }
  
  function enterFatIdle() {
    state = 'fatIdle'
    stateTimer = 80 + Math.floor(Math.random() * 120)
    setAnim('fatIdle')
  }

  function enterHide() {
    state = 'hiding'
    isReversing = false
    setAnim('hide')
    showBubble('Whats in files?')
  }
  // Sound functions
   


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
          const t = getTimeInfo()

          // sleepy walk
          let walkSpeed = 1.5
          if (t.isLateNight) walkSpeed = 0.5
          else if (t.isNight) walkSpeed = 0.8


          posX += dirX * (isFat ? 1.0 : walkSpeed)
    
          // Bounce off edges
          if (posX > sw - display) { posX = sw - display; dirX = -1; facingLeft = true  }
          if (posX < 0)             { posX = 0;            dirX =  1; facingLeft = false }
    
          idleTimer++
    
          // Fat Kirby — just walks and idles, no food/sleep
          if (isFat) {
            if (Math.random() < 0.003) enterFatIdle()
            break
          }
    

          // Time based "events"
  
        let sleepChance  = t.isLateNight ? 0.015 : t.isNight ? 0.008 : 0.003
        let idleChance   = t.isLateNight ? 0.008 : t.isNight ? 0.005 : 0.002
        let sneezeChance = 0.001
        let tripChance   = 0.001
        let hideChance   = 0.0005

          // Normal Kirby random events while walking
          if (Math.random() < 0.001) { enterSneeze(); break }
          if (Math.random() < 0.002) { enterIdle();   break }
          if (Math.random() < 0.0005) { enterHide();   break }
          if (Math.random() < 0.001){
            //beam kirby picks between trip or trip2
            if (currentSkin === 'beam' && Math.random() < 0.5){
              state = 'trip2'
              setAnim('trip2')
            } else {
              enterTrip()
            }
            break
          }

          
    
          // Food spawns after idle timer
          if (idleTimer > IDLE_TO_FOOD && !food && Math.random() < 0.005) {
            spawnFood()
            break
          }
    
          // Sleep after even longer
          if (idleTimer > IDLE_TO_SLEEP && Math.random() < (t.isLateNight ? 0.015 : t.isNight ? 0.008 : 0.003)) {
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
          if (stateTimer <= 0) {
            // 25% chance of fish react if that was the idle
            if (lastIdleAnim === 'idleFish' && Math.random() < 0.25) {
              state = 'fishReact'
              setAnim('fishReact')
            } else {
              enterWalk()
            }
            lastIdleAnim = null
          }
          break
        }

        //── FISH REACT──────────────────────────────────────────────────────
        case 'fishReact': {
          if (animDone) enterWalk()
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

        // ── TRIP2 ─────────────────────────────────────────────────────
        case 'trip2': {
          if(animDone) enterWalk()
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

      //── HIDE ───────────────────────────────────────────────────
      case 'hiding': {
        if (animDone) {
          // animation finished — Kirby is now hidden
          isHidden  = true
          hideTimer = 180 + Math.floor(Math.random() * 240) // 3-7 seconds
          state     = 'hidden'
        }
        break
      }
      
      case 'hidden': {
        hideTimer--
        if (hideTimer <= 0) {
          // reappear at random spot and play hide in reverse
          isHidden  = false
          posX      = Math.random() * (window.screen.width  - getDisplay())
          posY      = groundY
          isReversing = true
          frameIdx  = ANIM['hide'].frames - 1  // start from last frame
          frameTick = 0
          animDone  = false
          animName  = 'hide'
          state     = 'unhiding'
        }
        break
      }
      
      case 'unhiding': {
        if (animDone) {
          isReversing = false
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

  // draw food BEFORE kirby so it appears behind him
  if (food) drawFood(food.x, food.y)

  if (isHidden) return

  const frameImg = getFrames(animName)?.[frameIdx]
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

// drawFood is OUTSIDE draw() as a standalone function
function drawFood(x, y) {
  if (!currentFoodImg || !currentFoodImg.complete) return
  const size = 32
  ctx.drawImage(currentFoodImg, x, y, size, size)
}
 
  // speech bubble
  function drawBubble() {
    const display = getDisplay()
    const bx = posX + display / 2
    const by = posY + jumpY - 10
  
    ctx.font = 'bold 13px "KirbyClassic"' ///  cute kirby font
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
    ctx.fillStyle = '#c45c82'
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
  playSoundLoop('jump', 0.6)

  ipcRenderer.send('set-ignore-mouse', false)
  canvas.style.cursor = 'grabbing'
})

window.addEventListener('mouseup', (e) => {
  if (!isDragging) return
  isDragging = false
  canvas.style.cursor = 'none'
  ipcRenderer.send('set-ignore-mouse', true)
  stopSound('jump')

  // drop him — if above ground let him fall, otherwise just walk
  if (posY < groundY) {
    jumpV = 2   // small downward velocity so he falls naturally
    state = 'jumping'
  } else {
    posY  = groundY
    enterWalk()
    stopSound('jump')
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
//loadfoodImages(() => {}) // fills foodImages array synchronously via readdirSync
const allFrameImages = Object.values(sheets).flat()
const allImages = [...allFrameImages, ...foodImages]
const total = allImages.length
let loaded = 0


allImages.forEach(img => {
  img.onload  = () => { 
    loaded++
    if (loaded === total) {
      loop()
      playSound('poyo')  // only fires once
      showBubble('HI Alexis!!!!') 

      const t = getTimeInfo()
      setTimeout(() => {
        if (t.isAlexisBirthday) showBubble('HAPPY BIRTHDAY LOVE!!!!!!', 6000)
          else if (t.isNewYears) showBubble ('POYO HAPPY NEW YEARS!', 6000)
    }, 2000)
    }
  }
  img.onerror = () => {
    console.error(`failed: ${img.src}`)
    loaded++
    if (loaded === total) {
      loop()
      playSound('poyo')  // only fires once
    }
  }
})