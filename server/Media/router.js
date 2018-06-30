const { promisify } = require('util')
const fs = require('fs')
const stat = promisify(fs.stat)
const path = require('path')
const debug = require('debug')
const log = debug('app:Media')
const KoaRouter = require('koa-router')
const router = KoaRouter({ prefix: '/api/media' })
const getPerms = require('../lib/getPermutations')
const Media = require('./Media')

const audioExts = ['mp3', 'm4a'].reduce((perms, ext) => perms.concat(getPerms(ext)), [])

// stream a media file
router.get('/', async (ctx, next) => {
  const { type, mediaId } = ctx.query
  let file, fileExt

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

  file = res.entities[mediaId].file
  fileExt = path.extname(file).replace('.', '').toLowerCase()

  if (type === 'audio') {
    for (const ext of audioExts) {
      const audioFile = file.substr(0, file.length - fileExt.length) + ext

      try {
        const stats = await stat(audioFile)
        log('  => found %s audio file', ext)

        file = audioFile
        fileExt = ext
        ctx.length = stats.size
        break
      } catch (err) {
        file = null
        // keep looking for audio files...
      }
    } // end for

    if (!file) {
      ctx.throw(404, `No audio file found for mediaId: ${mediaId}`)
    }
  } else {
    const stats = await stat(file)
    ctx.length = stats.size
  }

  if (typeof Media.mimeTypes[fileExt] === 'undefined') {
    ctx.throw(404, `Unknown mime type for extension: ${fileExt}`)
  }

  log('streaming %s (%sMB): %s', ctx.type, (ctx.length / 1000000).toFixed(2), file)

  ctx.type = Media.mimeTypes[fileExt]
  ctx.body = fs.createReadStream(file)
})

module.exports = router
