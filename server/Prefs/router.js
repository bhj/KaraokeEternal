const path = require('path')
const log = require('../lib/Log').getLogger('Prefs')
const KoaRouter = require('koa-router')
const router = KoaRouter({ prefix: '/api/prefs' })
const getFolders = require('../lib/getFolders')
const getWindowsDrives = require('../lib/getWindowsDrives')
const Prefs = require('./Prefs')
const ytdl = require('ytdl-core')
const fs = require('fs')

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

  // must be admin or firstrun
  if (prefs.isFirstRun || ctx.user.isAdmin) {
    ctx.body = prefs
    return
  }

  // there are no non-admin prefs but we don't want to
  // trigger a fetch error on the frontend
  ctx.body = {}
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

// add youtube video
router.post('/youtube', async (ctx, next) => {
  const { url, version } = ctx.request.body

  log.verbose(`youtube link: ${url}`)
  log.verbose(`version: ${version}`)

  const requireAdmin = false

  if (requireAdmin && !ctx.user.isAdmin) {
    ctx.throw(401)
  }

  // required
  if (!url) {
    ctx.throw(422, 'Missing url')
  }

  if (!ytdl.validateURL(url)) {
    ctx.throw(422, 'Invalid url')
  }

  let info
  let title
  try {
    info = await ytdl.getInfo(url)
    title = info.videoDetails.title
  } catch (e) {
    log.error(JSON.stringify(e, null, 2))
    ctx.throw(400, 'Error getting video info')
  }

  false && log.verbose(JSON.stringify(info, null, 2))
  const artist = info.videoDetails?.author?.media?.artist
  if (artist) {
    if (!RegExp(`^${artist} *[-•] *`, 'i').test(title) && !RegExp(` in the style of +${artist}`, 'i').text(title)) {
      title = `${artist} - ${title}`
    }
  }
  if (version) {
    title = `${title} <${version}>`
  }
  const filename = `${title}.mp4`
  log.verbose(`Filename: ${filename}`)

  // TODO: get this dynamically
  const downloadDir = './youtubedl'
  const downloadPath = path.join(downloadDir, filename)
  if (fs.existsSync(downloadPath)) {
    ctx.throw(400, `"${title}" already exists - enter the "song version" if this is a different video`)
  }

  try {
    await new Promise((resolve, error) => {
      const readStream = ytdl.downloadFromInfo(info)
      const writeStream = fs.createWriteStream(downloadPath)

      writeStream.on('finish', resolve)
      readStream.on('error', error)
      writeStream.on('error', error)

      readStream.pipe(writeStream)
    })
  } catch (e) {
    log.error(JSON.stringify(e, null, 2))
    try {
      fs.unlinkSync(downloadPath)
    } catch (e) {
      log.error(JSON.stringify(e, null, 2))
    }
    ctx.throw(400, 'Error saving video')
  }

  ctx.body = {
    title,
  }

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

module.exports = router
