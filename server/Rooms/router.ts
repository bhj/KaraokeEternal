import KoaRouter from '@koa/router'
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator'
import getLogger from '../lib/Log.js'
import Rooms, { STATUSES } from '../Rooms/Rooms.js'
import { ValidationError } from '../lib/Errors.js'

interface RequestWithBody {
  body: Record<string, unknown>
}

const log = getLogger('Rooms')
const router = new KoaRouter({ prefix: '/api/rooms' })

// Cookie security: use secure flag in production or when proxy is required (HTTPS)
const isSecureCookie = () => process.env.NODE_ENV === 'production' || process.env.KES_REQUIRE_PROXY === 'true'

import { ROOM_PREFS_PUSH } from '../../shared/actionTypes.js'

// GET /api/rooms/:roomId/enrollment - Returns enrollment URL for unauthenticated users to redirect to SSO
// This is a public endpoint that doesn't require authentication
router.get('/:roomId/enrollment', async (ctx) => {
  const roomId = parseInt(ctx.params.roomId, 10)

  if (isNaN(roomId)) {
    ctx.throw(400, 'Invalid roomId')
  }

  // Check if Authentik is configured
  const authentikUrl = process.env.KES_AUTHENTIK_PUBLIC_URL
  const enrollmentFlow = process.env.KES_AUTHENTIK_ENROLLMENT_FLOW || 'karaoke-unified'

  if (!authentikUrl) {
    // SSO not configured
    ctx.body = { enrollmentUrl: null }
    return
  }

  // Get room to check if it exists and has an invitation token
  const res = await Rooms.get(roomId, { status: ['open'] })
  const room = res.entities[roomId]

  if (!room) {
    ctx.throw(404, 'Room not found or closed')
  }

  // Get invitation token from room data
  const data = await Rooms.getRoomData(roomId)
  const invitationToken = data?.invitationToken

  if (!invitationToken) {
    // No invitation token - can't enroll
    ctx.body = { enrollmentUrl: null }
    return
  }

  // Build enrollment URL
  const authUrl = new URL(authentikUrl)
  authUrl.pathname = `/if/flow/${enrollmentFlow}/`
  authUrl.searchParams.set('itoken', invitationToken)

  // Use relative URL - Authentik rejects absolute URLs in ?next (open redirect protection)
  // Guest's room assignment comes from X-Authentik-Karaoke-Room-Id header instead
  authUrl.searchParams.set('next', '/')

  ctx.body = { enrollmentUrl: authUrl.toString() }
})

// GET /api/rooms/my - Get the current user's own room (for standard users)
// IMPORTANT: Must be defined before /:roomId? to avoid being caught by that route
router.get('/my', async (ctx) => {
  // Must be authenticated and not a guest
  if (!ctx.user.userId || ctx.user.isGuest) {
    ctx.throw(401)
  }

  // Get user's own room
  const room = await Rooms.getByOwnerId(ctx.user.userId)

  if (!room) {
    ctx.body = { room: null }
    return
  }

  // Get room data (includes invitationToken)
  const roomData = await Rooms.getRoomData(room.roomId)

  // Build enrollment URL if Authentik is configured
  let enrollmentUrl = null
  const authentikUrl = process.env.KES_AUTHENTIK_PUBLIC_URL
  const enrollmentFlow = process.env.KES_AUTHENTIK_ENROLLMENT_FLOW || 'karaoke-unified'

  if (authentikUrl && roomData?.invitationToken) {
    const authUrl = new URL(authentikUrl)
    authUrl.pathname = `/if/flow/${enrollmentFlow}/`
    authUrl.searchParams.set('itoken', roomData.invitationToken)

    // Use relative URL - Authentik rejects absolute URLs in ?next (open redirect protection)
    // Guest's room assignment comes from X-Authentik-Karaoke-Room-Id header instead
    authUrl.searchParams.set('next', '/')

    enrollmentUrl = authUrl.toString()
  }

  ctx.body = {
    room: {
      roomId: room.roomId,
      name: room.name,
      status: room.status,
      invitationToken: roomData?.invitationToken ?? null,
      enrollmentUrl,
    },
  }
})

// GET /api/rooms/join/:roomId/:inviteCode - Smart QR entry point
// Routes logged-in users vs guests appropriately
router.get('/join/:roomId/:inviteCode', async (ctx) => {
  const roomId = parseInt(ctx.params.roomId, 10)
  const inviteCode = ctx.params.inviteCode

  // Validate room ID
  if (isNaN(roomId)) {
    ctx.throw(400, 'Invalid room ID')
  }

  // Validate invite code format (UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(inviteCode)) {
    ctx.throw(400, 'Invalid invite code')
  }

  if (ctx.user?.userId) {
    // LOGGED IN: Validate room and set visitation cookie
    const res = await Rooms.get(roomId)
    const room = res.entities[roomId]

    if (!room) {
      ctx.throw(404, 'Room not found')
    }

    // Verify invite code matches room's stored token
    const roomData = await Rooms.getRoomData(roomId)
    if (!roomData?.invitationToken || roomData.invitationToken !== inviteCode) {
      ctx.throw(403, 'Invalid invite code')
    }

    // Set visitation cookie (same logic as POST /rooms/:roomId/join)
    ctx.cookies.set('keVisitedRoom', String(roomId), {
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecureCookie(),
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    })

    log.info('%s joined room %d via Smart QR', ctx.user.name, roomId)
    ctx.redirect('/')
  } else {
    // NOT LOGGED IN: Redirect to Authentik enrollment
    const authentikUrl = process.env.KES_AUTHENTIK_PUBLIC_URL
    const enrollmentFlow = process.env.KES_AUTHENTIK_ENROLLMENT_FLOW || 'karaoke-unified'

    if (!authentikUrl) {
      ctx.throw(500, 'SSO not configured')
    }

    // Generate a friendly guest name (e.g., "RedPenguin", "BlueDolphin")
    const guestName = uniqueNamesGenerator({
      dictionaries: [colors, animals],
      separator: '',
      style: 'capital',
    })

    const enrollUrl = `${authentikUrl}/if/flow/${enrollmentFlow}/?itoken=${inviteCode}&guest_name=${encodeURIComponent(guestName)}`
    ctx.redirect(enrollUrl)
  }
})

// list rooms
router.get('/:roomId?', async (ctx) => {
  const roomId = ctx.params.roomId ? parseInt(ctx.params.roomId, 10) : undefined
  const status = ctx.user.isAdmin ? STATUSES : undefined
  const res = await Rooms.get(roomId, { status })

  res.result.forEach((roomId) => {
    if (ctx.user.isAdmin) {
      const room = ctx.io.sockets.adapter.rooms.get(Rooms.prefix(roomId))
      res.entities[roomId].numUsers = room ? room.size : 0
    } else {
      // only pass the 'roles' prefs key
      res.entities[roomId].prefs = res.entities[roomId].prefs?.roles ? { roles: res.entities[roomId].prefs.roles } : {}
    }
  })

  ctx.body = res
})

// create room
router.post('/', async (ctx) => {
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  try {
    const res = await Rooms.set(undefined, (ctx.request as unknown as RequestWithBody).body)
    log.verbose('%s created a room (roomId: %s)', ctx.user.name, res.lastID)
  } catch (err) {
    if (err instanceof ValidationError) ctx.throw(422, err.message)
    throw err
  }

  // send updated room list
  ctx.body = await Rooms.get(null, { status: STATUSES })
})

// update room
router.put('/:roomId', async (ctx) => {
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  const roomId = parseInt(ctx.params.roomId, 10)

  try {
    await Rooms.set(roomId, (ctx.request as unknown as RequestWithBody).body)
  } catch (err) {
    if (err instanceof ValidationError) ctx.throw(422, err.message)
    throw err
  }

  log.verbose('%s updated a room (roomId: %s)', ctx.user.name, roomId)

  const sockets = await ctx.io.in(Rooms.prefix(roomId)).fetchSockets()

  for (const s of sockets) {
    if (s?.user.isAdmin) {
      ctx.io.to(s.id).emit('action', {
        type: ROOM_PREFS_PUSH,
        payload: await Rooms.get(roomId),
      })
    }
  }

  // send updated room list
  ctx.body = await Rooms.get(null, { status: STATUSES })
})

// remove room
router.delete('/:roomId', async (ctx) => {
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  const roomId = parseInt(ctx.params.roomId, 10)

  if (isNaN(roomId)) {
    ctx.throw(422, 'Invalid roomId')
  }

  // Use deleteWithCleanup for explicit admin delete (cleans up Authentik resources)
  await Rooms.deleteWithCleanup(roomId)

  log.verbose('%s deleted roomId %s', ctx.user.name, roomId)

  // send updated room list
  ctx.body = await Rooms.get(null, { status: STATUSES })
})

// join another user's room (standard users only)
router.post('/:roomId/join', async (ctx) => {
  const user = ctx.state?.user ?? ctx.user

  // Guests cannot switch rooms - they're bound to their enrollment room
  if (user.isGuest) {
    ctx.throw(403, 'Guests cannot switch rooms')
  }

  const roomId = parseInt(ctx.params.roomId, 10)

  // Validate room exists and is open (no password check for cookie-based join)
  await Rooms.validate(roomId, null, { isOpen: true })

  // Set visitation cookie (httpOnly for security, secure in production)
  ctx.cookies.set('keVisitedRoom', String(roomId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureCookie(),
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  })

  log.verbose('%s joined room %d', user.name || user.username, roomId)

  ctx.body = { success: true }
})

// leave visited room and return to own room
router.post('/leave', async (ctx) => {
  ctx.cookies.set('keVisitedRoom', '', { maxAge: 0 })
  ctx.body = { success: true }
})

export default router
