import KoaRouter from '@koa/router'
import jsonWebToken from 'jsonwebtoken'
import 'koa-body' // Import for module augmentation (adds body to ctx.request)
import getLogger from '../lib/Log.js'
import Rooms from '../Rooms/Rooms.js'
import User from '../User/User.js'

const log = getLogger('Guest')
const router = new KoaRouter({ prefix: '/api/guest' })

// Cookie security: use secure flag in production or when proxy is required (HTTPS)
const isSecureCookie = () => process.env.NODE_ENV === 'production' || process.env.KES_REQUIRE_PROXY === 'true'

// Simple in-memory rate limiter
const joinAttempts = new Map<string, number[]>()
const RATE_LIMIT_MAX = 10 // Max requests per window
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute window

function rateLimit (ip: string): boolean {
  const now = Date.now()
  const attempts = (joinAttempts.get(ip) || []).filter(t => t > now - RATE_LIMIT_WINDOW_MS)

  if (attempts.length >= RATE_LIMIT_MAX) {
    return false // Rate limited
  }

  attempts.push(now)
  joinAttempts.set(ip, attempts)
  return true // Allowed
}

// Cleanup old rate limit entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now()
  for (const [ip, attempts] of joinAttempts.entries()) {
    const recent = attempts.filter(t => t > now - RATE_LIMIT_WINDOW_MS)
    if (recent.length === 0) {
      joinAttempts.delete(ip)
    } else {
      joinAttempts.set(ip, recent)
    }
  }
}, 5 * 60 * 1000)

interface GuestJoinBody {
  roomId: number
  inviteCode: string
  guestName: string
}

// POST /api/guest/join - App-managed guest session creation
// This replaces Authentik guest enrollment with direct app control
router.post('/join', async (ctx) => {
  const clientIP = ctx.request.socket?.remoteAddress || ctx.ip

  // Rate limiting check
  if (!rateLimit(clientIP)) {
    log.warn('Rate limited guest join attempt from %s', clientIP)
    ctx.throw(429, 'Too many requests. Please try again later.')
  }

  const body = (ctx.request as unknown as { body: GuestJoinBody }).body
  const { roomId, inviteCode, guestName } = body

  // Validate required fields
  if (!roomId || !inviteCode || !guestName) {
    ctx.throw(400, 'Invalid request')
  }

  // Validate invite code format (UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(inviteCode)) {
    ctx.throw(400, 'Invalid invitation')
  }

  // Validate room exists, is open, and invite code matches
  const roomData = await Rooms.getRoomData(roomId)
  if (!roomData?.invitationToken || roomData.invitationToken !== inviteCode) {
    ctx.throw(400, 'Invalid invitation')
  }

  // Create guest user (validates room is open internally)
  let guest
  try {
    guest = await User.createGuest(guestName, roomId)
  } catch (err) {
    log.warn('Guest creation failed for room %d: %s', roomId, (err as Error).message)
    ctx.throw(400, 'Invalid invitation')
  }

  // Build JWT payload with standard fields
  const jwtPayload = {
    userId: guest.userId,
    username: guest.username,
    name: guest.name,
    isAdmin: false,
    isGuest: true,
    roomId: roomId,
    ownRoomId: null, // Guests don't have their own room
    dateUpdated: guest.dateUpdated,
  }

  // Sign JWT and set cookie
  const token = jsonWebToken.sign(jwtPayload, ctx.jwtKey)
  ctx.cookies.set('keToken', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureCookie(),
    maxAge: 24 * 60 * 60 * 1000, // 24 hours (shorter than SSO users)
  })

  // Update room activity
  await Rooms.updateActivity(roomId)

  log.info('Guest %s (userId: %d) joined room %d', guest.username, guest.userId, roomId)

  ctx.body = { success: true }
})

export default router
