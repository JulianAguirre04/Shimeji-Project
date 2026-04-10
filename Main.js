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

  //skin Icons
  const normalIcon = nativeImage.createFromPath(
    path.join(__dirname, 'assets/icons/kirby_icon.png')
  ).resize({ width: 16, height: 16})

  const beamIcon = nativeImage.createFromPath(
    path.join(__dirname, 'assets/icons/beamIcon.png')
  ).resize({ width: 16, height: 16})

  // adding tray subsections for skin selection
  function buildMenu(activeSkin) {
    return Menu.buildFromTemplate([
      {
        label: 'Skins',
        submenu: [
          {
            label: 'OG Kirby',
            type: 'radio',
            checked: activeSkin === 'normal',
            icon: normalIcon,
            click: () => {
              win.webContents.send('set-skin', 'normal')
              tray.setContextMenu(buildMenu('normal'))
            }
          },
          {
            label: 'Silly Kirby',
            type: 'radio',
            checked: activeSkin === 'beam',
            icon: beamIcon,
            click: () => {
              win.webContents.send('set-skin', 'beam')
              tray.setContextMenu(buildMenu('beam'))
            }
          }
        ]
      },
      { type: 'separator' },
      {
        label: 'Toggle Kirby',
        click: () => {
          if (win.isVisible()) {
            win.hide()
          } else {
            win.show()
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => app.quit()
      }
    ])
  }

  tray.setToolTip('Kirby Pet')
  tray.setContextMenu(buildMenu('normal'))
}

ipcMain.on('set-ignore-mouse', (e, ignore) => {
  if (win) {
    win.setIgnoreMouseEvents(ignore, { forward: true })
  }
})

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