import KoaRouter from '@koa/router'
import jsonWebToken from 'jsonwebtoken'
import getLogger from '../lib/Log.js'
import User from '../User/User.js'
import Rooms from '../Rooms/Rooms.js'
import {
  isOidcConfigured,
  generateState,
  generateCodeVerifier,
  buildAuthorizationUrl,
  exchangeCode,
  extractUserClaims,
  validateRedirectUri,
} from './oidc.js'

const log = getLogger('Auth')
const router = new KoaRouter({ prefix: '/api/auth' })

// Cookie security: use secure flag in production or when proxy is required (HTTPS)
const isSecureCookie = () => process.env.NODE_ENV === 'production' || process.env.KES_REQUIRE_PROXY === 'true'

// State cookie name
const STATE_COOKIE = 'keOidcState'

/**
 * GET /api/auth/login
 *
 * Initiates the OIDC authorization flow:
 * 1. Generate random state (CSRF protection)
 * 2. Generate PKCE code_verifier
 * 3. Store state + code_verifier in httpOnly cookie
 * 4. Redirect to Authentik authorization URL
 */
router.get('/login', async (ctx) => {
  if (!isOidcConfigured()) {
    ctx.status = 503
    ctx.body = 'OIDC not configured'
    return
  }

  try {
    // Get redirect parameter (where to go after successful login)
    const redirect = validateRedirectUri(ctx.query.redirect as string)

    // Generate state and PKCE
    const state = generateState()
    const codeVerifier = generateCodeVerifier()

    // Build callback URL (must match Authentik app configuration)
    // Force HTTPS when behind proxy (Caddy terminates TLS)
    const protocol = process.env.KES_REQUIRE_PROXY === 'true' ? 'https' : ctx.request.protocol
    const host = ctx.request.host
    const urlPath = process.env.KES_URL_PATH?.replace(/\/?$/, '/') || '/'
    const callbackUrl = `${protocol}://${host}${urlPath}api/auth/callback`

    // Store state, code_verifier, and redirect in a secure cookie
    const stateData = JSON.stringify({ state, codeVerifier, redirect })
    ctx.cookies.set(STATE_COOKIE, stateData, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecureCookie(),
      maxAge: 10 * 60 * 1000, // 10 minutes - enough time for auth flow
    })

    // Build authorization URL and redirect
    const authUrl = await buildAuthorizationUrl(callbackUrl, state, codeVerifier)
    log.info('Initiating OIDC login, redirecting to Authentik')
    ctx.redirect(authUrl)
  } catch (err) {
    log.error('OIDC login error: %s', (err as Error).message)
    ctx.status = 500
    ctx.body = 'Authentication service unavailable'
  }
})

/**
 * GET /api/auth/callback
 *
 * Handles the OIDC callback from Authentik:
 * 1. Validate state matches cookie (CSRF protection)
 * 2. Exchange authorization code for tokens using PKCE
 * 3. Extract user claims from ID token
 * 4. Create or update user in database
 * 5. Set JWT session cookie
 * 6. Redirect to original destination
 */
router.get('/callback', async (ctx) => {
  if (!isOidcConfigured()) {
    ctx.status = 503
    ctx.body = 'OIDC not configured'
    return
  }

  try {
    const { code, state, error, error_description: errorDescription } = ctx.query

    // Handle OIDC errors
    if (error) {
      log.error('OIDC error: %s - %s', error, errorDescription)
      ctx.status = 400
      ctx.body = `Authentication error: ${error}`
      return
    }

    if (!code || !state) {
      ctx.status = 400
      ctx.body = 'Missing code or state parameter'
      return
    }

    // Retrieve state data from cookie
    const stateCookie = ctx.cookies.get(STATE_COOKIE)
    if (!stateCookie) {
      ctx.status = 400
      ctx.body = 'Missing or expired state cookie'
      return
    }

    // Parse and validate state
    let stateData: { state: string, codeVerifier: string, redirect: string }
    try {
      stateData = JSON.parse(stateCookie)
    } catch {
      ctx.status = 400
      ctx.body = 'Invalid state cookie'
      return
    }

    if (state !== stateData.state) {
      log.warn('OIDC state mismatch: potential CSRF attack')
      ctx.status = 400
      ctx.body = 'State mismatch'
      return
    }

    // Clear state cookie immediately
    ctx.cookies.set(STATE_COOKIE, '', { maxAge: 0 })

    // Build the full callback URL with query params (as received from Authentik)
    // Force HTTPS when behind proxy (Caddy terminates TLS)
    const protocol = process.env.KES_REQUIRE_PROXY === 'true' ? 'https' : ctx.request.protocol
    const host = ctx.request.host
    const urlPath = process.env.KES_URL_PATH?.replace(/\/?$/, '/') || '/'
    const fullCallbackUrl = `${protocol}://${host}${urlPath}api/auth/callback?code=${encodeURIComponent(code as string)}&state=${encodeURIComponent(state as string)}`

    // Exchange code for tokens
    const tokenResponse = await exchangeCode(
      fullCallbackUrl,
      stateData.codeVerifier,
      stateData.state,
    )

    // Extract user claims from ID token
    const claims = extractUserClaims(tokenResponse)
    log.info('OIDC callback: user=%s groups=%j isAdmin=%s isGuest=%s',
      claims.username, claims.groups, claims.isAdmin, claims.isGuest)

    // Get or create user (reuses existing SSO header auth logic)
    const user = await User.getOrCreateFromHeader(claims.username, claims.isAdmin, claims.isGuest)

    // Handle room assignment (similar to SSO header auth in serverWorker.ts)
    const ephemeralEnabled = process.env.KES_EPHEMERAL_ROOMS !== 'false'
    let room: { roomId: number } | null = null
    let ownRoomId: number | null = null

    if (!claims.isGuest && ephemeralEnabled) {
      // Standard user: get or create their ephemeral room
      room = await Rooms.getByOwnerId(user.userId)
      if (!room) {
        const roomId = await Rooms.createEphemeral(user.userId, user.username)
        room = { roomId }
      }
      ownRoomId = room.roomId
    }

    // Build JWT payload
    const jwtPayload = {
      userId: user.userId,
      username: user.username,
      name: user.name,
      isAdmin: claims.isAdmin || user.role === 'admin',
      isGuest: claims.isGuest || user.role === 'guest',
      roomId: room?.roomId ?? null,
      ownRoomId,
      dateUpdated: user.dateUpdated,
    }

    // Set JWT cookie
    const token = jsonWebToken.sign(jwtPayload, ctx.jwtKey)
    ctx.cookies.set('keToken', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecureCookie(),
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    })

    log.info('OIDC login successful for user %s (userId: %d)', user.username, user.userId)

    // Redirect to original destination (validated earlier)
    ctx.redirect(stateData.redirect)
  } catch (err) {
    const error = err as Error & { cause?: unknown }
    log.error('OIDC callback error: %s', error.message)
    log.error('OIDC callback error stack: %s', error.stack)
    if (error.cause) {
      log.error('OIDC callback error cause: %j', error.cause)
    }
    ctx.status = 500
    ctx.body = 'Authentication failed'
  }
})

export default router
