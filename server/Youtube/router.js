const { promisify } = require('util')
const fs = require('fs')
const stat = promisify(fs.stat)
const path = require('path')
const log = require('../lib/Log').getLogger('Youtube')
const KoaRouter = require('koa-router')
const router = KoaRouter({ prefix: '/api/youtube' })
const Prefs = require('../Prefs')

// stream a youtube karaoke.mp4 file
router.get('/:youtubeVideoId', async (ctx, next) => {
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  // get base path
  const { tmpOutputPath } = await Prefs.get()

  const file = path.join(tmpOutputPath, ctx.params.youtubeVideoId, 'karaoke.mp4')

  if (!fs.existsSync(file)) {
    ctx.throw(404, 'The karaoke.mp4 file could not be found')
  }

  // get file info
  const stats = await stat(file)
  ctx.length = stats.size
  ctx.type = 'video/mp4'

  log.verbose('streaming %s (%sMB): %s', ctx.type, (ctx.length / 1000000).toFixed(2), file)
  ctx.body = fs.createReadStream(file)
})

module.exports = router
