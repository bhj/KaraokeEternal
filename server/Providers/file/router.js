const db = require('sqlite')
const squel = require('squel')
const { promisify } = require('util')
const fs = require('fs')
const stat = promisify(fs.stat)
const path = require('path')
const debug = require('debug')
const log = debug('app:provider:file')
const KoaRouter = require('koa-router')

const router = KoaRouter({ prefix: '/api/provider/file' }) // singular
const getFolders = require('./lib/getFolders')
const getProviders = require('../getProviders')
const Media = require('../../Media')

const {
  PROVIDER_REQUEST_SCAN,
} = require('../../../constants/actions')

// add media file path
router.post('/path', async (ctx, next) => {
  const dir = decodeURIComponent(ctx.query.dir)
  let paths

  // must be admin
  if (!ctx.user.isAdmin) {
    ctx.status = 401
    return
  }

  // required
  if (!dir) {
    ctx.status = 422
    ctx.body = `Invalid path`
    return
  }

  try {
    const res = await getProviders()
    paths = res.entities.file.prefs.paths || []
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
    return Promise.reject(err)
  }

  // is it a subfolder of an already-added folder?
  if (paths.some(p => dir.indexOf(p + path.sep) === 0)) {
    ctx.status = 500
    ctx.body = 'Folder has already been added'
    return
  }

  // update paths
  paths.push(dir)

  try {
    await setPaths(paths)
    ctx.status = 200
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
  }

  // auto scan
  process.send({
    'type': PROVIDER_REQUEST_SCAN,
    'payload': 'file',
  })
})

// remove media file path
router.delete('/path/:idx', async (ctx, next) => {
  let paths

  // must be admin
  if (!ctx.user.isAdmin) {
    ctx.status = 401
    return
  }

  // required
  if (!ctx.params.idx) {
    ctx.status = 422
    ctx.body = `Invalid path index`
    return
  }

  try {
    const res = await getProviders()
    paths = res.entities.file.prefs.paths || []
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
    return Promise.reject(err)
  }

  // update paths
  paths.splice(ctx.params.idx, 1)

  try {
    await setPaths(paths)
    ctx.status = 200
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
  }

  // auto scan
  process.send({
    'type': PROVIDER_REQUEST_SCAN,
    'payload': 'file',
  })
})

// get folder listing for path browser
router.get('/ls', async (ctx, next) => {
  // must be admin
  if (!ctx.user.isAdmin) {
    ctx.status = 401
    return
  }

  try {
    const dir = decodeURIComponent(ctx.query.dir)
    const current = path.resolve(dir)
    const parent = path.resolve(dir, '../')

    const list = await getFolders(dir)
    const children = list.map(d => {
      return {
        path: d,
        displayPath: d.replace(current + path.sep, '')
      }
    })

    log('%s listed folder %s', ctx.user.name, current)

    ctx.body = {
      current,
      // if at root, parent and current are the same
      parent: parent === current ? false : parent,
      // don't show hidden folders
      children: children.filter(c => !c.displayPath.startsWith('.')),
    }
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
  }
})

// get media file
router.get('/media', async (ctx, next) => {
  // must be admin
  if (!ctx.user.isAdmin) {
    ctx.status = 401
    return
  }

  let media, file
  const { type, mediaId } = ctx.query

  if (!type || !mediaId) {
    ctx.status = 422
    ctx.body = "Missing 'type' or 'mediaId'"
    return
  }

  // get media info
  try {
    const res = await Media.getMedia({ mediaId })

    if (!res.result.length) {
      ctx.status = 404
      ctx.body = `mediaId not found: ${mediaId}`
      return
    }

    media = res.entities[mediaId]
    file = media.providerData.basePath + media.providerData.relPath
  } catch (err) {
    log(err)
    return Promise.reject(err)
  }

  if (type === 'audio') {
    const info = path.parse(file)
    file = file.substr(0, file.length - info.ext.length) + media.providerData.audioExt
  }

  // get file size (and does it exist?)
  try {
    const stats = await stat(file)

    // stream it!
    log('streaming file (%s bytes): %s', stats.size, file)
    ctx.length = stats.size
    ctx.body = fs.createReadStream(file)
  } catch (err) {
    log(err)
    ctx.status = 404
    ctx.body = `File not found: ${file}`
  }
})

module.exports = router

async function setPaths (paths) {
  try {
    const q = squel.update()
      .table('providers')
      .set('prefs', squel.select()
        .field(`json_set(prefs, '$.paths', json('${JSON.stringify(paths)}'))`)
        .from('providers')
        .where('name = ?', 'file')
      )
      .where('name = ?', 'file')

    const { text, values } = q.toParam()
    await db.run(text, values)
    return Promise.resolve()
  } catch (err) {
    return Promise.reject(err)
  }
}
