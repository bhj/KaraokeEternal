const { app, shell, clipboard, BrowserWindow, Tray, Menu } = require('electron')
const path = require('path')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
let tray = null
const status = {
  url: '',
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

function createWindow () {
  win = new BrowserWindow({
    show: false,
    skipTaskbar: true, // windows
  })

  // macOS
  if (app.dock) {
    app.dock.hide()
  }

  tray = new Tray(path.join(app.getAppPath(), 'public', 'icon-tray.png'))
  tray.setToolTip('Karaoke Forever Server')
  updateMenu()

  // Emitted when the window is closed.
  win.on('closed', () => {
    win = null
  })
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
    { label: 'Open in browser', click: () => shell.openExternal(status.url) },
    { label: 'Copy URL', click: () => clipboard.writeText(status.url) },
    { type: 'separator' },
    { label: 'Quit Karaoke Forever Server', role: 'quit' },
  ]

  tray.setContextMenu(Menu.buildFromTemplate(menu))
}

module.exports = { setStatus }
