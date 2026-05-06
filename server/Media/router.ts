import fs from 'fs'
import fsPromises from 'node:fs/promises'
import { Readable } from 'stream'
import path from 'path'
import { unzip } from 'unzipit'
import { Server as SocketIO } from 'socket.io'
import getLogger from '../lib/Log.js'
import getCdgName from '../lib/getCdgName.js'
import { getExt } from '../lib/util.js'
import KoaRouter from '@koa/router'
import Library from '../Library/Library.js'
import Media from './Media.js'
import Prefs from '../Prefs/Prefs.js'
import Queue from '../Queue/Queue.js'
import Rooms from '../Rooms/Rooms.js'
import fileTypes from './fileTypes.js'
import { LIBRARY_PUSH_SONG, QUEUE_PUSH } from '../../shared/actionTypes.js'
const log = getLogger('Media')
const router = new KoaRouter({ prefix: '/api/media' })

const audioExts = Object.keys(fileTypes).filter(ext => fileTypes[ext].mimeType.startsWith('audio/'))

// stream a media file
router.get('/:mediaId', async (ctx) => {
  const { type } = ctx.query

  const isManagerOfRoom = ctx.user.role === 'room_manager'
    && typeof ctx.user.roomId === 'number'
    && Rooms.isManager(ctx.user.roomId, ctx.user.userId)

  if (!ctx.user.isAdmin && !isManagerOfRoom) {
    ctx.throw(401)
  }

  const mediaId = parseInt(ctx.params.mediaId, 10)

  if (Number.isNaN(mediaId) || !type) {
    ctx.throw(422, 'invalid mediaId or type')
  }

  // get media info
  const res = Media.search({ mediaId })

  if (!res.result.length) {
    ctx.throw(404, 'mediaId not found')
  }

  const { pathId, relPath } = res.entities[mediaId]

  // get base path
  const { paths } = Prefs.get()
  const basePath = paths.entities[pathId].path

  let file = path.join(basePath, relPath)
  let buffer

  if (getExt(file) === '.zip') {
    const { entries } = await unzip(new Uint8Array(await fsPromises.readFile(file)))
    let entry

    if (type === 'cdg') {
      entry = Object.keys(entries).find(f => !f.includes('/') && getExt(f) === '.cdg')
      if (!entry) ctx.throw(404, 'No .cdg file found in archive')
    } else {
      entry = Object.keys(entries).find(f => !f.includes('/') && audioExts.includes(getExt(f)))
      if (!entry) ctx.throw(404, 'No valid audio file found in archive')
    }

    ctx.length = entries[entry].size
    ctx.type = fileTypes[getExt(entry)]?.mimeType
    buffer = Buffer.from(await entries[entry].arrayBuffer())
  } else {
    if (type === 'cdg') {
      file = getCdgName(file)
      if (!file) ctx.throw(404, 'The .cdg file could not be found')
    }

    const stats = await fsPromises.stat(file)
    ctx.length = stats.size
    ctx.type = fileTypes[getExt(file)]?.mimeType
  }

  if (!ctx.type) ctx.throw(404, `Unknown MIME type: ${file}`)

  log.verbose('streaming %s (%sMB): %s', ctx.type, (ctx.length / 1000000).toFixed(2), file)
  ctx.body = buffer ? Readable.from(buffer) : fs.createReadStream(file)
})

/**
 * Emit QUEUE_PUSH to a specific set of rooms (by roomId).
 * Used after preference changes to push only affected queues.
 */
function emitQueuePushToRooms (io: SocketIO, roomIds: number[]): void {
  if (roomIds.length === 0) return
  const roomIdSet = new Set(roomIds)

  for (const { room, roomId } of Rooms.getActive(io)) {
    if (roomIdSet.has(roomId)) {
      io.to(room).emit('action', {
        type: QUEUE_PUSH,
        payload: Queue.get(roomId),
      })
    }
  }
}

// Set the global default version for a song (admin only).
// Clears any existing isPreferred flag for the song and optionally sets a new
// one.  Also re-resolves any queued instances of the song that are not already
// overridden by a room or user preference.
router.all('/:mediaId/prefer', (ctx) => {
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  const mediaId = parseInt(ctx.params.mediaId, 10)

  if (Number.isNaN(mediaId) || (ctx.request.method !== 'PUT' && ctx.request.method !== 'DELETE')) {
    ctx.throw(422)
  }

  const isPreferred = ctx.request.method === 'PUT'
  const songId = Media.setPreferred(mediaId, isPreferred)

  // Re-resolve queue rows not covered by a room or user override, then push
  // only the affected rooms rather than broadcasting to every active room.
  const affectedRoomIds = Queue.rerouteForPref({ scope: 'global', songId })
  emitQueuePushToRooms(ctx.io, affectedRoomIds)

  ctx.status = 200
  ctx.io.emit('action', {
    type: LIBRARY_PUSH_SONG,
    payload: Library.getSong(songId),
  })
})

// Set a room-level default version for a song (room managers only).
// Overrides the global isPreferred for users in this room who have not set a
// personal preference.  The room manager must manage the target room.
router.all('/:mediaId/prefer/room/:roomId', (ctx) => {
  const roomId = parseInt(ctx.params.roomId, 10)

  // Must be admin, or a manager of the specific room being modified.
  const canEdit = ctx.user.isAdmin
    || (ctx.user.role === 'room_manager' && Rooms.isManager(roomId, ctx.user.userId))

  if (!canEdit || Number.isNaN(roomId)) {
    ctx.throw(401)
  }

  const mediaId = parseInt(ctx.params.mediaId, 10)

  if (Number.isNaN(mediaId) || (ctx.request.method !== 'PUT' && ctx.request.method !== 'DELETE')) {
    ctx.throw(422)
  }

  const isPreferred = ctx.request.method === 'PUT'
  const songId = Media.setRoomPreferred(mediaId, roomId, isPreferred)

  // Re-resolve queue rows in this room that are not overridden by a user pref.
  const affectedRoomIds = Queue.rerouteForPref({ scope: 'room', songId, roomId })
  emitQueuePushToRooms(ctx.io, affectedRoomIds)

  ctx.status = 200
  ctx.io.emit('action', {
    type: LIBRARY_PUSH_SONG,
    payload: Library.getSong(songId),
  })
})

// Set a personal version preference for a song (any authenticated user).
// Highest priority in the resolution chain; applies even for guest accounts.
// Clearing the preference (DELETE) falls back to the room or global default.
router.all('/:mediaId/prefer/user', (ctx) => {
  // Must be a real user (not an unauthenticated request)
  if (typeof ctx.user.userId !== 'number') {
    ctx.throw(401)
  }

  const mediaId = parseInt(ctx.params.mediaId, 10)

  if (Number.isNaN(mediaId) || (ctx.request.method !== 'PUT' && ctx.request.method !== 'DELETE')) {
    ctx.throw(422)
  }

  const isPreferred = ctx.request.method === 'PUT'
  const songId = Media.setUserPreferred(mediaId, ctx.user.userId, isPreferred)

  // Re-resolve only this user's queued instances of the song across all rooms.
  const affectedRoomIds = Queue.rerouteForPref({ scope: 'user', songId, userId: ctx.user.userId })
  emitQueuePushToRooms(ctx.io, affectedRoomIds)

  ctx.status = 200
  ctx.io.emit('action', {
    type: LIBRARY_PUSH_SONG,
    payload: Library.getSong(songId),
  })
})

export default router
