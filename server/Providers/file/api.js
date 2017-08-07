const db = require('sqlite')
const squel = require('squel')
const fs = require('fs')
const path = require('path')
const debug = require('debug')
const log = debug('app:provider:file')
const KoaRouter = require('koa-router')
const router = KoaRouter({ prefix: '/api/provider/file' })

const getFolders = require('../../lib/async/getFolders')
const getProviders = require('../getProviders')
const stat = require('../../lib/async/stat')

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

router.get('/media', async (ctx, next) => {
  // check jwt validity
  if (!ctx.user.isAdmin) {
    ctx.status = 401
    return
  }

  const { type, songId } = ctx.query
  let file, stats

  if (!type || !songId) {
    ctx.status = 422
    ctx.body = "Missing 'type' or 'songId' in url"
    return
  }

  // get song from db
  try {
    // 2nd param is true since we need providerData
    const res = await getLibrary({ songId }, true)

    if (!res.songs.result.length) {
      ctx.status = 404
      ctx.body = `songId not found: ${songId}`
      return
    }

    const row = res.songs.entities[res.songs.result[0]]
    file = row.providerData.path
  } catch (err) {
    log(err.message)
    return Promise.reject(err)
  }

  if (type === 'cdg') {
    const info = path.parse(file)
    file = file.substr(0, file.length - info.ext.length) + '.cdg'
  }

  // get file size (and does it exist?)
  try {
    stats = await stat(file)
  } catch (err) {
    ctx.status = 404
    ctx.body = `File not found: ${file}`
    return
  }

  // stream it!
  log('streaming %s', file)

  ctx.length = stats.size
  ctx.body = fs.createReadStream(file)
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
