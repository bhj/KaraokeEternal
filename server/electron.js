const { app, shell, clipboard, BrowserWindow, Tray, Menu } = require('electron')
const path = require('path')
const log = require('debug')(`app:master:electron [${process.pid}]`)
const project = require('../project.config')
const isDev = (process.defaultApp || /node_modules[\\/]electron[\\/]/.test(process.execPath))
const ICON_PATH = path.join(project.basePath, isDev ? 'public' : 'dist')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
let tray = null
const status = {
  url: '',
}

// NODE_ENV won't automatically pass to (non-Electron) forked processes;
// set it for them now based on detected dev/prod state
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = isDev ? 'development' : 'production'
}

// pass user data path to (non-Electron) forked processes
process.env.USER_DATA_PATH = app.getPath('userData')

// event handlers
app.on('ready', createWindow)
app.on('quit', (e, code) => { log(`quitting (exit code ${code})`) })

function createWindow () {
  win = new BrowserWindow({
    show: false,
    skipTaskbar: true, // windows
  })

  // macOS
  if (app.dock) {
    app.dock.hide()
  }

  if (process.platform === 'win32') {
    // white 32x32
    tray = new Tray(path.join(ICON_PATH, 'mic-white@2x.png'))
  } else {
    // blackish 32x32 (template works in light and dark macOS modes)
    tray = new Tray(path.join(ICON_PATH, 'mic-blackTemplate.png'))
    tray.setPressedImage(path.join(ICON_PATH, 'mic-white.png'))
  }

  tray.setToolTip('Karaoke Forever Server')
  tray.on('double-click', launchBrowser)
  updateMenu()

  // Emitted when the window is closed.
  win.on('closed', () => {
    win = null
    tray = null
  })
}

function launchBrowser () {
  if (status.url) {
    shell.openExternal(status.url)
  }
}

function setStatus (key, val) {
  status[key] = val
  updateMenu()
}

function updateMenu () {
  if (!tray) return

  const menu = [
    { label: `Karaoke Forever Server`, enabled: false },
    { label: status.url, enabled: false },
    { type: 'separator' },
    { label: 'Open in browser', click: launchBrowser },
    { label: 'Copy URL', click: () => clipboard.writeText(status.url) },
    { type: 'separator' },
    { label: 'Quit Karaoke Forever Server', role: 'quit' },
  ]

  tray.setContextMenu(Menu.buildFromTemplate(menu))
}

module.exports = { setStatus }
