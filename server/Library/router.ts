import { db } from '../lib/Database.js'
import sql from 'sqlate'
import KoaRouter from '@koa/router'
import Media from '../Media/Media.js'

const router = new KoaRouter({ prefix: '/api' })

// Lists underlying media files for a given song, augmented with the
// requesting user's preference context so the client can render the
// appropriate preference controls without a second round-trip.
//
// Access: all authenticated users (not just admins) because guests and
// regular users need to view and set their personal version preference.
// Unauthenticated requests (userId === null) receive global-only data.
router.get('/song/:songId', async (ctx) => {
  // Must be a known user; anonymous requests cannot have preferences.
  if (typeof ctx.user.userId !== 'number' && !ctx.user.isAdmin) {
    ctx.throw(401)
  }

  const songId = parseInt(ctx.params.songId, 10)

  if (Number.isNaN(songId)) {
    ctx.throw(422, 'Invalid songId')
  }

  const res = Media.search({ songId })

  if (!res.result.length) {
    ctx.throw(404)
  }

  // Look up which mediaId (if any) is set as the room default and the
  // user's personal preference for this song, so the client can highlight
  // the active preference tier for each media row.
  let roomPrefMediaId: number | null = null
  let userPrefMediaId: number | null = null

  if (typeof ctx.user.roomId === 'number') {
    const roomRow = db.get<{ mediaId: number }>(
      String(sql`SELECT mediaId FROM roomMediaPrefs WHERE roomId = ${ctx.user.roomId} AND songId = ${songId}`),
      sql`SELECT mediaId FROM roomMediaPrefs WHERE roomId = ${ctx.user.roomId} AND songId = ${songId}`.parameters,
    )
    roomPrefMediaId = roomRow?.mediaId ?? null
  }

  if (typeof ctx.user.userId === 'number') {
    const userRow = db.get<{ mediaId: number }>(
      String(sql`SELECT mediaId FROM userMediaPrefs WHERE userId = ${ctx.user.userId} AND songId = ${songId}`),
      sql`SELECT mediaId FROM userMediaPrefs WHERE userId = ${ctx.user.userId} AND songId = ${songId}`.parameters,
    )
    userPrefMediaId = userRow?.mediaId ?? null
  }

  // Annotate each media entity with the two extra preference flags.
  for (const mediaId of res.result) {
    res.entities[mediaId].roomPreferred = mediaId === roomPrefMediaId
    res.entities[mediaId].userPreferred = mediaId === userPrefMediaId
  }

  ctx.body = res
})

export default router
