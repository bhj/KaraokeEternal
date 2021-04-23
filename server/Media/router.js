const { promisify } = require('util')
const fs = require('fs')
const stat = promisify(fs.stat)
const path = require('path')
const log = require('../lib/Log').getLogger('Media')
const getCdgName = require('../lib/getCdgName')
const KoaRouter = require('koa-router')
const router = KoaRouter({ prefix: '/api/media' })
const Library = require('../Library')
const Media = require('./Media')
const Prefs = require('../Prefs')
const Queue = require('../Queue')
const Rooms = require('../Rooms')
const {
  LIBRARY_PUSH_SONG,
  QUEUE_PUSH
} = require('../../shared/actionTypes')

// stream a media file
router.get('/:mediaId', async (ctx, next) => {
  const { type } = ctx.query

  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  const mediaId = parseInt(ctx.params.mediaId, 10)

  if (Number.isNaN(mediaId) || !type) {
    ctx.throw(422, 'invalid mediaId or type')
  }

  // get media info
  const res = await Media.search({ mediaId })

  if (!res.result.length) {
    ctx.throw(404, 'mediaId not found')
  }

  const { pathId, relPath } = res.entities[mediaId]

  // get base path
  const { paths } = await Prefs.get()
  const basePath = paths.entities[pathId].path

  let file = path.join(basePath, relPath)

  if (type === 'cdg') {
    file = await getCdgName(file)

    if (!file) {
      ctx.throw(404, 'The .cdg file could not be found')
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

// set isPreferred flag
router.all('/:mediaId/prefer', async (ctx, next) => {
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  const mediaId = parseInt(ctx.params.mediaId, 10)

  if (Number.isNaN(mediaId) || (ctx.request.method !== 'PUT' && ctx.request.method !== 'DELETE')) {
    ctx.throw(422)
  }

  const songId = await Media.setPreferred(mediaId, ctx.request.method === 'PUT')
  ctx.status = 200

  // emit (potentially) updated queues to each room
  for (const room of ctx.io.sockets.adapter.rooms.keys()) {
    // ignore auto-generated per-user rooms
    if (room.startsWith(Rooms.prefix())) {
      const roomId = parseInt(room.substring(Rooms.prefix().length), 10)

      ctx.io.to(room).emit('action', {
        type: QUEUE_PUSH,
        payload: await Queue.get(roomId),
      })
    }
  }

  // emit (potentially) new duration
  ctx.io.emit('action', {
    type: LIBRARY_PUSH_SONG,
    payload: await Library.getSong(songId),
  })
})

module.exports = router
