const fs = require('fs')
const path = require('path')
const debug = require('debug')
const log = debug('app:provider:cdg')
const getLibrary = require('../../lib/getLibrary')
const stat = require('../../lib/thunks/stat')
const KoaRouter = require('koa-router')
const router = KoaRouter({ prefix: '/api/provider/cdg' })

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
