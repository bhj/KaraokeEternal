const { promisify } = require('util')
const fs = require('fs')
const stat = promisify(fs.stat)
const path = require('path')
const log = require('../lib/logger')('Media')
const getCdgName = require('../lib/getCdgName')
const KoaRouter = require('koa-router')
const router = KoaRouter({ prefix: '/api/media' })
const Media = require('./Media')
const Prefs = require('../Prefs')

// stream a media file
router.get('/', async (ctx, next) => {
  const { type, mediaId } = ctx.query

  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  if (!type || !mediaId) {
    ctx.throw(422, "Missing 'type' or 'mediaId'")
  }

  // get media info
  const res = await Media.search({ mediaId })

  if (!res.result.length) {
    ctx.throw(404, `mediaId not found: ${mediaId}`)
  }

  const { pathId, relPath } = res.entities[mediaId]

  // get base path
  const { paths } = await Prefs.get()
  const basePath = paths.entities[pathId].path

  let file = path.join(basePath, relPath)

  if (type === 'cdg') {
    file = await getCdgName(file)

    if (!file) {
      ctx.throw(404, `No cdg file found`)
    }
  }

  // get file info
  const stats = await stat(file)
  ctx.length = stats.size
  ctx.type = Media.mimeTypes[path.extname(file).replace('.', '').toLowerCase()]

  if (typeof ctx.type === 'undefined') {
    ctx.throw(404, `Unknown mime type for extension: ${path.extname(file)}`)
  }

  log.verbose('streaming %s (%sMB): %s', ctx.type, (ctx.length / 1000000).toFixed(2), file)
  ctx.body = fs.createReadStream(file)
})

module.exports = router
