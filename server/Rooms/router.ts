import KoaRouter from '@koa/router'
import { uniqueNamesGenerator, colors, animals } from 'unique-names-generator'
import getLogger from '../lib/Log.js'
import Rooms, { STATUSES } from '../Rooms/Rooms.js'
import { ValidationError } from '../lib/Errors.js'
import HydraFolders from '../HydraPresets/HydraFolders.js'
import HydraPresets from '../HydraPresets/HydraPresets.js'

interface RequestWithBody {
  body: Record<string, unknown>
}

const log = getLogger('Rooms')
const router = new KoaRouter({ prefix: '/api/rooms' })

// Cookie security: use secure flag in production or when proxy is required (HTTPS)
const isSecureCookie = () => process.env.NODE_ENV === 'production' || process.env.KES_REQUIRE_PROXY === 'true'

import { ROOM_PREFS_PUSH } from '../../shared/actionTypes.js'
import { resolveRoomAccessPrefs } from '../../shared/roomAccess.js'

const sanitizeRoomPrefsForClient = (roomPrefs: Record<string, unknown> = {}) => {
  const accessPrefs = resolveRoomAccessPrefs(roomPrefs)

  return {
    ...accessPrefs,
    partyPresetFolderId: typeof roomPrefs.partyPresetFolderId === 'number' ? roomPrefs.partyPresetFolderId : null,
    restrictCollaboratorsToPartyPresetFolder: roomPrefs.restrictCollaboratorsToPartyPresetFolder === true,
    startingPresetId: typeof roomPrefs.startingPresetId === 'number' ? roomPrefs.startingPresetId : null,
  }
}

const buildEnrollmentUrl = (invitationToken?: string | null): string | null => {
  const authentikUrl = process.env.KES_AUTHENTIK_PUBLIC_URL
  const enrollmentFlow = process.env.KES_AUTHENTIK_ENROLLMENT_FLOW || 'karaoke-guest-enrollment'

  if (!authentikUrl || !invitationToken) {
    return null
  }

  const authUrl = new URL(authentikUrl)
  authUrl.pathname = '/if/flow/' + enrollmentFlow + '/'
  authUrl.searchParams.set('itoken', invitationToken)

  // Use relative URL - Authentik rejects absolute URLs in ?next (open redirect protection)
  // Guest returns to / which goes through forward_auth to establish SSO session
  authUrl.searchParams.set('next', '/')

  return authUrl.toString()
}
// NOTE: Enrollment endpoint removed - guests now use app-managed sessions via /api/guest/join
// Standard users use SSO login via Authentik, not enrollment

// GET /api/rooms/join/validate - Validate invitation token and return room info
// This is a public endpoint for the landing page to display room name
router.get('/join/validate', async (ctx) => {
  const itoken = ctx.query.itoken as string

  if (!itoken) {
    ctx.throw(400, 'Invalid invitation')
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(itoken)) {
    ctx.throw(400, 'Invalid invitation')
  }

  // Direct SQL lookup - O(1) instead of O(N)
  const room = await Rooms.getByInvitationToken(itoken)

  // Generic error for both invalid and not-found (prevent oracle attack)
  if (!room) {
    ctx.throw(404, 'Invalid invitation')
  }

  ctx.body = { roomName: room.name, roomId: room.roomId }
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

  // Get room data (includes invitationToken + prefs)
  const roomData = await Rooms.getRoomData(room.roomId)
  const roomPrefs = roomData?.prefs && typeof roomData.prefs === 'object'
    ? roomData.prefs as Record<string, unknown>
    : {}

  ctx.body = {
    room: {
      roomId: room.roomId,
      name: room.name,
      status: room.status,
      invitationToken: roomData?.invitationToken ?? null,
      enrollmentUrl: buildEnrollmentUrl(roomData?.invitationToken ?? null),
      prefs: sanitizeRoomPrefsForClient(roomPrefs),
    },
  }
})

// PUT /api/rooms/my/prefs - Update own room access/preset policy (owner only)
router.put('/my/prefs', async (ctx) => {
  if (!ctx.user.userId || ctx.user.isGuest) {
    ctx.throw(401)
  }

  const room = await Rooms.getByOwnerId(ctx.user.userId)
  if (!room) {
    ctx.throw(404, 'Room not found')
  }

  const body = (ctx.request as unknown as RequestWithBody).body ?? {}
  const requestedPrefs = body.prefs

  if (!requestedPrefs || typeof requestedPrefs !== 'object' || Array.isArray(requestedPrefs)) {
    ctx.throw(422, 'Invalid room prefs payload')
  }

  const requestedPrefsObj = requestedPrefs as Record<string, unknown>

  const roomData = await Rooms.getRoomData(room.roomId)
  const currentPrefs = roomData?.prefs && typeof roomData.prefs === 'object'
    ? roomData.prefs as Record<string, unknown>
    : {}

  const nextPrefs: Record<string, unknown> = {
    ...currentPrefs,
  }

  if ('allowGuestOrchestrator' in requestedPrefsObj) {
    nextPrefs.allowGuestOrchestrator = requestedPrefsObj.allowGuestOrchestrator === true
  }

  if ('allowGuestCameraRelay' in requestedPrefsObj) {
    nextPrefs.allowGuestCameraRelay = requestedPrefsObj.allowGuestCameraRelay === true
  }

  if ('allowRoomCollaboratorsToSendVisualizer' in requestedPrefsObj) {
    nextPrefs.allowRoomCollaboratorsToSendVisualizer = requestedPrefsObj.allowRoomCollaboratorsToSendVisualizer === true
  }

  if ('restrictCollaboratorsToPartyPresetFolder' in requestedPrefsObj) {
    nextPrefs.restrictCollaboratorsToPartyPresetFolder = requestedPrefsObj.restrictCollaboratorsToPartyPresetFolder === true
  }

  if ('partyPresetFolderId' in requestedPrefsObj) {
    const rawFolderId = requestedPrefsObj.partyPresetFolderId

    if (rawFolderId === null || rawFolderId === '') {
      nextPrefs.partyPresetFolderId = null
    } else if (typeof rawFolderId === 'number' && Number.isInteger(rawFolderId) && rawFolderId > 0) {
      const folder = await HydraFolders.getById(rawFolderId)
      if (!folder) {
        ctx.throw(422, 'Party preset folder not found')
      }
      nextPrefs.partyPresetFolderId = rawFolderId
    } else {
      ctx.throw(422, 'Invalid party preset folder')
    }
  }

  if ('startingPresetId' in requestedPrefsObj) {
    const rawPresetId = requestedPrefsObj.startingPresetId

    if (rawPresetId === null || rawPresetId === '') {
      nextPrefs.startingPresetId = null
    } else if (typeof rawPresetId === 'number' && Number.isInteger(rawPresetId) && rawPresetId > 0) {
      const preset = await HydraPresets.getById(rawPresetId)
      if (!preset) {
        ctx.throw(422, 'Starting preset not found')
      }
      nextPrefs.startingPresetId = rawPresetId
    } else {
      ctx.throw(422, 'Invalid starting preset')
    }
  }

  if (nextPrefs.restrictCollaboratorsToPartyPresetFolder === true && typeof nextPrefs.partyPresetFolderId !== 'number') {
    ctx.throw(422, 'Party preset folder is required when restriction is enabled')
  }

  if (nextPrefs.restrictCollaboratorsToPartyPresetFolder !== true) {
    nextPrefs.restrictCollaboratorsToPartyPresetFolder = false
  }

  await Rooms.set(room.roomId, {
    name: room.name,
    status: room.status,
    prefs: nextPrefs,
  })

  const sockets = await ctx.io.in(Rooms.prefix(room.roomId)).fetchSockets()
  for (const s of sockets) {
    if (s?.user.isAdmin) {
      ctx.io.to(s.id).emit('action', {
        type: ROOM_PREFS_PUSH,
        payload: {
          roomId: room.roomId,
          prefs: nextPrefs,
        },
      })
    }
  }

  log.verbose('%s updated own room prefs (roomId: %s)', ctx.user.name, room.roomId)

  const updatedRoomData = await Rooms.getRoomData(room.roomId)

  ctx.body = {
    room: {
      roomId: room.roomId,
      name: room.name,
      status: room.status,
      invitationToken: updatedRoomData?.invitationToken ?? null,
      enrollmentUrl: buildEnrollmentUrl(updatedRoomData?.invitationToken ?? null),
      prefs: sanitizeRoomPrefsForClient(nextPrefs),
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
    // NOT LOGGED IN: Redirect to app landing page
    // Generate a friendly guest name for UX preview (e.g., "Join as RedPenguin 🎉")
    // Authentik handles collision detection if name is taken
    const guestName = uniqueNamesGenerator({
      dictionaries: [colors, animals],
      separator: '',
      style: 'capital',
    })

    ctx.redirect(`/join?itoken=${inviteCode}&guest_name=${encodeURIComponent(guestName)}`)
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
      const roomPrefs = res.entities[roomId].prefs ?? {}
      res.entities[roomId].prefs = {
        roles: roomPrefs.roles ?? {},
        ...sanitizeRoomPrefsForClient(roomPrefs),
      }
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
