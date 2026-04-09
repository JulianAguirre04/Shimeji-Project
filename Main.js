const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } = require('electron')
const path = require('path')

let win
let tray

function createWindow() {
  win = new BrowserWindow({
    show: false,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    transparent: true,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  win.maximize()
  win.loadFile('src/index.html')
  win.setIgnoreMouseEvents(true, { forward: true })

  win.once('ready-to-show', () => {
    win.show()
    win.webContents.openDevTools({ mode: 'detach' }) // remove when done debugging---------------------------------------------------------------
  })
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'assets/Icon/Kirby_icon.png'))
  tray = new Tray(icon)

  const menu = Menu.buildFromTemplate([
    { label: 'Toggle Kirby', click: () => win.isVisible() ? win.hide() : win.show() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ])

  tray.setToolTip('Kirby Pet')
  tray.setContextMenu(menu)
}

// ipcMain only once, outside everything
ipcMain.on('set-ignore-mouse', (e, ignore) => {
  win.setIgnoreMouseEvents(ignore, { forward: true })
})

app.whenReady().then(() => {
  createWindow()
  createTray()

  app.setLoginItemSettings({
    openAtLogin: true,
    openAsHidden: true
  })
})

process.on('SIGINT', () => app.quit())
app.on('window-all-closed', (e) => e.preventDefault())