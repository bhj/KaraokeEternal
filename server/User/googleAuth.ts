import KoaRouter from '@koa/router'
import jsonWebToken from 'jsonwebtoken'
import getLogger from '../lib/Log.js'
import { randomChars } from '../lib/util.js'
import User from './User.js'
import Rooms from '../Rooms/Rooms.js'

const log = getLogger('googleAuth')
const { sign: jwtSign } = jsonWebToken

// CSRF state store: nonce -> { roomId, roomPassword, popup, createdAt }
const pendingStates = new Map<string, { roomId: number | null, roomPassword: string, popup: boolean, createdAt: number }>()
const STATE_TTL_MS = 10 * 60 * 1000 // 10 minutes

function cleanExpiredStates () {
  const now = Date.now()
  for (const [nonce, state] of pendingStates) {
    if (now - state.createdAt > STATE_TTL_MS) {
      pendingStates.delete(nonce)
    }
  }
}

// Takes the "raw" object returned by the User class and massages it
// into the shape used by the client (state.user) and in server-side routers
const createUserCtx = (user, roomId) => ({
  dateCreated: user.dateCreated,
  dateUpdated: user.dateUpdated,
  isAdmin: user.role === 'admin',
  isGuest: user.role === 'guest',
  name: user.name,
  roomId: parseInt(roomId, 10) || null,
  userId: user.userId,
  username: user.username,
})

function createRouter (urlPath: string) {
  const router = new KoaRouter({ prefix: '/api' })
  // Base URL for redirecting back to the SPA (e.g. "/" or "/karaoke/")
  const appBase = urlPath

  // Initiate Google OAuth flow
  router.get('/auth/google', async (ctx) => {
    const clientId = process.env.KES_GOOGLE_CLIENT_ID
    const redirectUri = process.env.KES_GOOGLE_REDIRECT_URI

    if (!clientId || !redirectUri) {
      log.error('Google OAuth is not configured (KES_GOOGLE_CLIENT_ID and KES_GOOGLE_REDIRECT_URI must be set)')
      ctx.throw(501, 'Google sign-in is not configured on this server')
    }

    const roomId = ctx.query.roomId ? parseInt(ctx.query.roomId as string, 10) : null
    const roomPassword = (ctx.query.roomPassword as string) || ''
    const popup = ctx.query.popup === '1'

    cleanExpiredStates()

    const nonce = randomChars(32)
    pendingStates.set(nonce, { roomId, roomPassword, popup, createdAt: Date.now() })

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state: nonce,
      access_type: 'online',
    })

    ctx.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
  })

  // Handle Google OAuth callback
  router.get('/auth/google/callback', async (ctx) => {
    const clientId = process.env.KES_GOOGLE_CLIENT_ID
    const clientSecret = process.env.KES_GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.KES_GOOGLE_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUri) {
      log.error('Google OAuth is not configured')
      ctx.throw(501, 'Google sign-in is not configured on this server')
    }

    const { code, state, error } = ctx.query as Record<string, string>

    // Google returned an error (e.g., user cancelled)
    if (error) {
      log.verbose('Google OAuth error: %s', error)
      ctx.redirect(`${appBase}account?error=google_cancelled`)
      return
    }

    if (!code || !state) {
      ctx.redirect(`${appBase}account?error=google_missing_params`)
      return
    }

    // Validate CSRF state
    const pendingState = pendingStates.get(state)
    if (!pendingState) {
      log.warn('Google OAuth: invalid or expired state')
      ctx.redirect(`${appBase}account?error=google_invalid_state`)
      return
    }
    pendingStates.delete(state)

    const { roomId, roomPassword, popup } = pendingState

    // Helper: finish the flow depending on whether we're in a popup
    const finishError = (errorCode: string) => {
      if (popup) {
        ctx.type = 'html'
        ctx.body = `<!DOCTYPE html><html><body><script>
          window.opener && window.opener.postMessage({type:'google-auth-error',error:${JSON.stringify(errorCode)}}, '*');
          window.close();
        </script></body></html>`
      } else {
        ctx.redirect(`${appBase}account?error=${errorCode}`)
      }
    }

    // Exchange authorization code for tokens
    let googleAccessToken: string
    try {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }).toString(),
      })

      const tokenData = await tokenRes.json() as { access_token?: string, error?: string }

      if (!tokenData.access_token) {
        log.error('Google OAuth: token exchange failed: %s', tokenData.error)
        finishError('google_token_failed')
        return
      }

      googleAccessToken = tokenData.access_token
    } catch (err) {
      log.error('Google OAuth: token exchange error: %s', err.message)
      finishError('google_token_failed')
      return
    }

    // Get user profile from Google
    let googleId: string
    let email: string
    let name: string
    try {
      const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${googleAccessToken}` },
      })

      const profile = await profileRes.json() as { id?: string, email?: string, name?: string, error?: unknown }

      if (!profile.id || !profile.email) {
        log.error('Google OAuth: missing profile data')
        finishError('google_profile_failed')
        return
      }

      googleId = profile.id
      email = profile.email
      name = profile.name || email
    } catch (err) {
      log.error('Google OAuth: profile fetch error: %s', err.message)
      finishError('google_profile_failed')
      return
    }

    // Find or create user
    let user = User.getByGoogleId(googleId)

    if (!user) {
      try {
        const userId = await User.createGoogleUser({ googleId, email, name })
        user = User.getById(userId)
      } catch (err) {
        log.error('Google OAuth: user creation failed: %s', err.message)
        finishError('google_user_failed')
        return
      }
    }

    if (!user) {
      log.error('Google OAuth: user not found after creation')
      finishError('google_user_failed')
      return
    }

    // Validate room (required for non-admins)
    if (roomId) {
      try {
        await Rooms.validate(roomId, roomPassword || undefined, {
          isOpen: user.role !== 'admin',
          validatePassword: true,
        })
      } catch (err) {
        log.warn('Google OAuth: room validation failed: %s', err.message)
        finishError('google_room_invalid')
        return
      }
    } else if (user.role !== 'admin') {
      finishError('google_room_required')
      return
    }

    const userCtx = createUserCtx(user, roomId)

    // Create JWT
    const token = jwtSign(userCtx, ctx.jwtKey)

    // Set JWT as an httpOnly cookie
    ctx.cookies.set('keToken', token, {
      httpOnly: true,
      sameSite: 'lax',
    })

    // Finish: in popup mode send a message to the opener and close; otherwise redirect
    if (popup) {
      ctx.type = 'html'
      ctx.body = `<!DOCTYPE html><html><body><script>
        window.opener && window.opener.postMessage({type:'google-auth-success'}, '*');
        window.close();
      </script></body></html>`
    } else {
      ctx.redirect(appBase)
    }
  })

  return router
}

export default createRouter
