const { app, shell, clipboard, dialog, BrowserWindow, Tray, Menu } = require('electron')
const path = require('path')
const log = require('./Log')(`main:electron[${process.pid}]`)

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
let tray = null
const status = {
  url: '',
}

module.exports = ({ env }) => {
  // event handlers
  app.on('ready', createWindow)
  app.on('quit', (e, code) => { log.info(`exiting (${code})`) })

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
      tray = new Tray(path.join(env.KES_PATH_ASSETS, 'mic-white@2x.png'))
    } else {
      // blackish 32x32 (template works in light and dark macOS modes)
      tray = new Tray(path.join(env.KES_PATH_ASSETS, 'mic-blackTemplate.png'))
      tray.setPressedImage(path.join(env.KES_PATH_ASSETS, 'mic-white.png'))
    }

    tray.setToolTip('Karaoke Eternal Server v' + app.getVersion())
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

  function setError (msg) {
    dialog.showErrorBox('Karaoke Eternal Server', `Error: ${msg}`)
  }

  function setStatus (key, val) {
    status[key] = val
    updateMenu()
  }

  function updateMenu () {
    if (!tray) return

    const menu = [
      { label: 'Karaoke Eternal Server v' + app.getVersion(), enabled: false },
      { label: status.url, enabled: false },
      { type: 'separator' },
      { label: 'Open in browser', click: launchBrowser },
      { label: 'Copy URL', click: () => clipboard.writeText(status.url) },
      { type: 'separator' },
      { label: 'Quit Karaoke Eternal Server', role: 'quit' },
    ]

    tray.setContextMenu(Menu.buildFromTemplate(menu))
  }

  return { app, setStatus, setError }
}
