const path = require('path')
const axios = require('axios')
const log = require('../lib/Log').getLogger('Prefs')
const KoaRouter = require('koa-router')
const router = KoaRouter({ prefix: '/api/prefs' })
const getFolders = require('../lib/getFolders')
const getWindowsDrives = require('../lib/getWindowsDrives')
const Prefs = require('./Prefs')
const shell = require('../lib/Shell')

// start media scan
router.get('/scan', async (ctx, next) => {
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  ctx.status = 200
  ctx.startScanner()
})

// stop media scan
router.get('/scan/stop', async (ctx, next) => {
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  ctx.status = 200
  ctx.stopScanner()
})

// get preferences and media paths
router.get('/', async (ctx, next) => {
  const prefs = await Prefs.get()

  // only include public prefs if not an admin or first-run...
  if (!prefs.isFirstRun && !ctx.user.isAdmin) {
    ctx.body = await Prefs.get(true)
  } else {
    ctx.body = prefs
  }
})

// add media file path
router.post('/path', async (ctx, next) => {
  const dir = decodeURIComponent(ctx.query.dir)

  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  // required
  if (!dir) {
    ctx.throw(422, 'Invalid path')
  }

  await Prefs.addPath(dir)

  // respond with updated prefs
  ctx.body = await Prefs.get()

  // update library
  ctx.startScanner()
})

// remove media file path
router.delete('/path/:pathId', async (ctx, next) => {
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  const pathId = parseInt(ctx.params.pathId, 10)

  if (isNaN(pathId)) {
    ctx.throw(422, 'Invalid pathId')
  }

  await Prefs.removePath(pathId)

  // respond with updated prefs
  ctx.body = await Prefs.get()

  // update library
  ctx.startScanner()
})

// get folder listing for path browser
router.get('/path/ls', async (ctx, next) => {
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  const dir = decodeURIComponent(ctx.query.dir)

  // windows is a special snowflake and gets an
  // extra top level of available drive letters
  if (dir === '' && process.platform === 'win32') {
    const drives = await getWindowsDrives()

    ctx.body = {
      current: '',
      parent: false,
      children: drives,
    }
  } else {
    const current = path.resolve(dir)
    const parent = path.resolve(dir, '../')

    const list = await getFolders(dir)
    log.verbose('%s listed path: %s', ctx.user.name, current)

    ctx.body = {
      current,
      // if at root, windows gets a special top level
      parent: parent === current ? (process.platform === 'win32' ? '' : false) : parent,
      children: list.map(p => ({
        path: p,
        label: p.replace(current + path.sep, '')
      })).filter(c => !(c.label.startsWith('.') || c.label.startsWith('/.')))
    }
  }
})

// tests that the spleeter command is working
router.get('/testspleeter', async (ctx, next) => {
  const { spleeterPath } = await Prefs.get()
  try {
    const result = await shell.promisifiedExec(spleeterPath + ' --version')

    // make sure the version is good...
    if (result.toLowerCase().startsWith('spleeter version: ')) {
      const version = result.substr(18)
      if (version.startsWith('2.')) {
        ctx.body = {
          success: true,
          message: 'Spleeter ' + version + ' was found!'
        }
      } else {
        ctx.body = {
          success: false,
          message: 'Spleeter ' + version + ' was found. This might work, but we expected v2.x.x'
        }
      }
    } else {
      ctx.body = {
        success: false,
        message: 'Something\'s wrong... ' + result
      }
    }
  } catch (err) {
    ctx.body = {
      success: false,
      message: err.message
    }
  }
})

// tests that the AutoLyrixAlign Service
router.get('/testautolyrix', async (ctx, next) => {
  const { autoLyrixHost } = await Prefs.get()
  try {
    const result = await axios.get(autoLyrixHost + '/version')

    // make sure the version is good...
    if (result && result.status == 200 && result.data.toLowerCase().startsWith('autolyrixalignservice ')) {
      const version = result.data.substr(22)
      if (version.startsWith('1.')) {
        ctx.body = {
          success: true,
          message: 'AutoLyrixAlign Service ' + version + ' was found!'
        }
      } else {
        ctx.body = {
          success: false,
          message: 'AutoLyrixAlign Service ' + version + ' was found. This might work, but we expected v1.x.x'
        }
      }
    } else {
      ctx.body = {
        success: false,
        message: 'The request succeeded, but this doesn\'t look like AutoLyrixAlign Service. Here\'s what we got... ' + result.data
      }
    }
  } catch (err) {
    ctx.body = {
      success: false,
      message: err.message
    }
  }
})

// tests that the spleeter command is working
router.get('/testffmpeg', async (ctx, next) => {
  const { ffmpegPath } = await Prefs.get()
  try {
    const result = await shell.promisifiedExec(ffmpegPath + ' -version')

    // make sure the version is good...
    if (result.toLowerCase().startsWith('ffmpeg version ')) {
      let version = result.substr(15)
      version = version.substr(0, version.search(/\s/g)).trim()

      if (version.startsWith('3.') || version.startsWith('4.')) {
        ctx.body = {
          success: true,
          message: 'FFMPEG ' + version + ' was found!'
        }
      } else {
        ctx.body = {
          success: false,
          message: 'FFMPEG ' + version + ' was found. This might work, but we expected v3.x.x or v4.x.x'
        }
      }
    } else {
      ctx.body = {
        success: false,
        message: 'Something\'s wrong... ' + result
      }
    }
  } catch (err) {
    ctx.body = {
      success: false,
      message: err.message
    }
  }
})

module.exports = router
