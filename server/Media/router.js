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

const audioExts = ['.mp3', '.m4a'].reduce((perms, ext) => perms.concat(getPerms(ext)), [])

// get media file
router.get('/', async (ctx, next) => {
  // must be admin
  if (!ctx.user.isAdmin) {
    ctx.status = 401
    return
  }

  const { type, mediaId } = ctx.query
  let file

  if (!type || !mediaId) {
    ctx.status = 422
    ctx.body = "Missing 'type' or 'mediaId'"
    return
  }

  // get media info
  try {
    const res = await Media.search({ mediaId })

    if (!res.result.length) {
      ctx.status = 404
      ctx.body = `mediaId not found: ${mediaId}`
      return
    }

    file = res.entities[mediaId].file
  } catch (err) {
    log(err)
    return Promise.reject(err)
  }

  if (type === 'audio') {
    for (const ext of audioExts) {
      const audioFile = file.substr(0, file.length - path.extname(file).length) + ext

      try {
        await stat(audioFile)

        // success
        log('  => found %s audio file', ext)
        file = audioFile
        break
      } catch (err) {
        // keep looking...
      }
    } // end for
  } // end if

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
