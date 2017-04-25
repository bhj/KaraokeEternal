const fs = require('fs')
const path = require('path')
const debug = require('debug')
const log = debug('app:provider:cdg')
const getSongs = require('../../lib/getSongs')
const stat = require('../../lib/thunks/stat')
const KoaRouter = require('koa-router')
const router = KoaRouter({ prefix: '/api/provider/cdg' })

router.get('/resource', async (ctx, next) => {
  const { type, songId } = ctx.query
  let file, stats

  if (!type || !songId) {
    ctx.status = 422
    ctx.body = "Missing 'type' or 'songId' in url"
    return
  }

  // get song from db
  try {
    const res = await getSongs({ songId })

    if (!res.result.length) {
      ctx.status = 404
      ctx.body = `songId not found: ${songId}`
      return
    }

    const row = res.entities[res.result[0]]
    // should be the audio file path
    file = JSON.parse(row.providerData).path
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
  log('Streaming file: %s', file)

  ctx.length = stats.size
  ctx.body = fs.createReadStream(file)
})

module.exports = router
